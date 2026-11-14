import { useEffect, useMemo, useRef, useState } from "react";
import { formatMonthLabel, formatMonthShort, shiftMonth } from "../../lib/date";
import { formatCompactIDR, formatIDR } from "../../lib/format";
import { inMonth, summarize } from "../../lib/summary";
import type { Transaction } from "../../lib/types";

/** Enam bulan terakhir, berakhir di bulan yang sedang dipilih. */
const MONTH_COUNT = 6;

const TOP = 14;
const RIGHT = 4;
const BOTTOM = 30;
const LEFT = 48;
const HEIGHT = 190;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;
const BAR_GAP = 3;
const MIN_CHART_WIDTH = 240;

/** Bulatkan nilai tertinggi ke angka yang enak dibaca di sumbu Y. */
function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Batang dengan sudut atas membulat, alas tetap rata di garis nol. */
function barPath(x: number, y: number, width: number, height: number): string {
  const radius = Math.min(3, width / 2, height);
  return `M${x} ${y + height}V${y + radius}Q${x} ${y} ${x + radius} ${y}H${x + width - radius}Q${
    x + width
  } ${y} ${x + width} ${y + radius}V${y + height}Z`;
}

/**
 * Lebar SVG diukur dari wadahnya, bukan diskalakan dari viewBox tetap:
 * label sumbu tetap terbaca di ponsel 320 px maupun tablet.
 */
function useElementWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => setWidth(Math.max(MIN_CHART_WIDTH, Math.round(node.clientWidth)));
    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

interface MonthlyFlowChartProps {
  transactions: Transaction[];
  month: string;
}

export function MonthlyFlowChart({ transactions, month }: MonthlyFlowChartProps) {
  const [active, setActive] = useState(MONTH_COUNT - 1);
  const [chartRef, chartWidth] = useElementWidth(328);

  // Pindah bulan berarti jendela grafik bergeser; pilihan kembali ke bulan terpilih.
  useEffect(() => {
    setActive(MONTH_COUNT - 1);
  }, [month]);

  const series = useMemo(
    () =>
      Array.from({ length: MONTH_COUNT }, (_, index) => {
        const key = shiftMonth(month, index - (MONTH_COUNT - 1));
        const totals = summarize(inMonth(transactions, key));
        return { key, income: totals.income, expense: totals.expense, net: totals.net };
      }),
    [transactions, month],
  );

  const max = niceMax(
    series.reduce((highest, item) => Math.max(highest, item.income, item.expense), 0),
  );
  const activeMonth = series[active];
  const scale = (value: number) => (max > 0 ? (value / max) * PLOT_HEIGHT : 0);

  const plotWidth = chartWidth - LEFT - RIGHT;
  const groupWidth = plotWidth / MONTH_COUNT;
  const barWidth = Math.min(16, Math.max(9, Math.round(groupWidth * 0.36)));
  const baseY = TOP + PLOT_HEIGHT;

  return (
    <section className="mx-4 mt-5 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold tracking-tight text-ink">Arus kas 6 bulan</h2>
          <p className="mt-0.5 text-[11px] text-muted">Ketuk batang untuk melihat rincian</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pb-0.5 text-[11px] font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-income" />
            Masuk
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-expense" />
            Keluar
          </span>
        </div>
      </div>

      {max === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-ink">Belum ada arus kas</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Enam bulan terakhir belum ada pemasukan atau pengeluaran yang tercatat.
          </p>
        </div>
      ) : (
        <>
          <div ref={chartRef} className="mt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
              role="group"
              aria-label="Grafik arus kas enam bulan terakhir"
              className="block w-full"
            >
              {[0, 0.5, 1].map((fraction) => {
                const y = baseY - fraction * PLOT_HEIGHT;
                return (
                  <g key={fraction}>
                    <line
                      x1={LEFT}
                      x2={chartWidth - RIGHT}
                      y1={y}
                      y2={y}
                      stroke="var(--color-line)"
                      strokeWidth={1}
                      strokeDasharray={fraction === 0 ? undefined : "2 3"}
                    />
                    <text
                      x={LEFT - 7}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize={10}
                      fill="var(--color-muted)"
                    >
                      {formatCompactIDR(max * fraction)}
                    </text>
                  </g>
                );
              })}

              {series.map((item, index) => {
                const groupLeft = LEFT + index * groupWidth;
                const center = groupLeft + groupWidth / 2;
                const incomeX = center - barWidth - BAR_GAP / 2;
                const expenseX = center + BAR_GAP / 2;
                const incomeHeight = scale(item.income);
                const expenseHeight = scale(item.expense);
                const yearSuffix =
                  item.key.slice(0, 4) === month.slice(0, 4) ? "" : ` '${item.key.slice(2, 4)}`;

                return (
                  <g key={item.key}>
                    {active === index ? (
                      <rect
                        x={groupLeft + 2}
                        y={TOP - 6}
                        width={Math.max(groupWidth - 4, 0)}
                        height={PLOT_HEIGHT + 12}
                        rx={10}
                        fill="var(--color-canvas)"
                      />
                    ) : null}

                    {incomeHeight > 0 ? (
                      <path
                        d={barPath(incomeX, baseY - incomeHeight, barWidth, incomeHeight)}
                        fill="var(--color-income)"
                      />
                    ) : null}
                    {expenseHeight > 0 ? (
                      <path
                        d={barPath(expenseX, baseY - expenseHeight, barWidth, expenseHeight)}
                        fill="var(--color-expense)"
                      />
                    ) : null}

                    <text
                      x={center}
                      y={HEIGHT - 10}
                      textAnchor="middle"
                      fontSize={10.5}
                      fontWeight={active === index ? 700 : 500}
                      fill={active === index ? "var(--color-ink)" : "var(--color-muted)"}
                    >
                      {formatMonthShort(item.key)}
                      {yearSuffix}
                    </text>
                  </g>
                );
              })}

              {series.map((item, index) => (
                <g
                  key={`hit-${item.key}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active === index}
                  aria-label={`${formatMonthLabel(item.key)}: masuk ${formatIDR(
                    item.income,
                  )}, keluar ${formatIDR(item.expense)}`}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActive(index);
                      return;
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      const next = Math.min(
                        MONTH_COUNT - 1,
                        Math.max(0, index + (event.key === "ArrowRight" ? 1 : -1)),
                      );
                      setActive(next);
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <title>
                    {`${formatMonthLabel(item.key)} · masuk ${formatIDR(
                      item.income,
                    )} · keluar ${formatIDR(item.expense)}`}
                  </title>
                  <rect
                    x={LEFT + index * groupWidth}
                    y={TOP - 6}
                    width={groupWidth}
                    height={PLOT_HEIGHT + 12}
                    fill="transparent"
                  />
                </g>
              ))}
            </svg>
          </div>

          <div aria-live="polite" className="mt-2 rounded-xl bg-canvas px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[12px] font-semibold text-ink">
                {formatMonthLabel(activeMonth.key)}
              </p>
              <p className="shrink-0 text-[11px] font-medium text-muted">
                Selisih{" "}
                <span
                  className={`font-bold tabular-nums ${
                    activeMonth.net < 0 ? "text-expense" : "text-income"
                  }`}
                >
                  {activeMonth.net < 0 ? "−" : ""}
                  {formatCompactIDR(Math.abs(activeMonth.net))}
                </span>
              </p>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted">
              <span>
                Masuk{" "}
                <span className="font-semibold tabular-nums text-income">
                  {formatIDR(activeMonth.income)}
                </span>
              </span>
              <span>
                Keluar{" "}
                <span className="font-semibold tabular-nums text-expense">
                  {formatIDR(activeMonth.expense)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
