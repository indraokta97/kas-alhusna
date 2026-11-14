import { useMemo, useState } from "react";
import { formatMonthLabel } from "../../lib/date";
import { formatCompactIDR, formatIDR } from "../../lib/format";
import type { CategoryTotal } from "../../lib/summary";
import type { TxType } from "../../lib/types";

/** Sisanya digabung supaya donat tetap terbaca di layar ponsel. */
const MAX_SLICES = 5;
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 76;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

const PALETTE: Record<TxType, string[]> = {
  in: ["#0b7a4d", "#2f9a6a", "#5cb98b", "#8ed3ae", "#c2e8d4"],
  out: ["#b3342f", "#cc5a50", "#e0827a", "#f0aaa4", "#f8d2ce"],
};

const LABEL: Record<TxType, { title: string; total: string }> = {
  in: { title: "Komposisi pemasukan", total: "Total pemasukan" },
  out: { title: "Komposisi pengeluaran", total: "Total pengeluaran" },
};

function groupSlices(items: CategoryTotal[]): CategoryTotal[] {
  if (items.length <= MAX_SLICES) return items;

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const rest = items.slice(MAX_SLICES - 1);
  const amount = rest.reduce((sum, item) => sum + item.amount, 0);

  return [
    ...items.slice(0, MAX_SLICES - 1),
    {
      category: "Lainnya",
      amount,
      share: total > 0 ? Math.round((amount / total) * 100) : 0,
    },
  ];
}

interface CategoryDonutProps {
  income: CategoryTotal[];
  expense: CategoryTotal[];
  month: string;
}

export function CategoryDonut({ income, expense, month }: CategoryDonutProps) {
  const [mode, setMode] = useState<TxType>("out");

  const items = mode === "in" ? income : expense;
  const total = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const slices = useMemo(() => groupSlices(items), [items]);
  const colors = PALETTE[mode];

  let cursor = 0;
  const arcs = slices.map((slice, index) => {
    const length = total > 0 ? (slice.amount / total) * CIRCUMFERENCE : 0;
    const dash = Math.max(length - GAP, 0.5);
    const offset = -cursor;
    cursor += length;
    return { ...slice, color: colors[index], dash, offset };
  });

  const options: Array<{ value: TxType; label: string; dot: string; activeTone: string }> = [
    { value: "out", label: "Pengeluaran", dot: "bg-expense", activeTone: "text-expense" },
    { value: "in", label: "Pemasukan", dot: "bg-income", activeTone: "text-income" },
  ];

  return (
    <section className="mx-4 mt-5 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold tracking-tight text-ink">Komposisi</h2>
          <p className="mt-0.5 truncate text-[11px] text-muted">{formatMonthLabel(month)}</p>
        </div>
        <span className="shrink-0 pt-0.5 text-[11px] font-medium text-muted">
          {items.length} kategori
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
        {options.map((option) => {
          const active = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(option.value)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-[12px] transition-colors ${
                active
                  ? `bg-surface font-semibold shadow-sm ${option.activeTone}`
                  : "font-medium text-muted hover:text-ink"
              }`}
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
              {option.label}
            </button>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${LABEL[mode].title} ${formatMonthLabel(
          month,
        )}: ${formatIDR(total)} dari ${items.length} kategori`}
        className="mx-auto mt-3 block h-[188px] w-[188px]"
      >
        <title>{`${LABEL[mode].title} · ${formatMonthLabel(month)} · ${formatIDR(total)}`}</title>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {total > 0 ? (
            arcs.map((arc) => (
              <circle
                key={arc.category}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
                strokeDashoffset={arc.offset}
              >
                <title>{`${arc.category}: ${formatIDR(arc.amount)} (${arc.share}%)`}</title>
              </circle>
            ))
          ) : (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={STROKE}
            />
          )}
        </g>

        <text
          x={CENTER}
          y={94}
          textAnchor="middle"
          fontSize={10.5}
          fill="var(--color-muted)"
        >
          {LABEL[mode].total}
        </text>
        <text
          x={CENTER}
          y={120}
          textAnchor="middle"
          fontSize={19}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          {formatCompactIDR(total)}
        </text>
        <text
          x={CENTER}
          y={138}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-muted)"
        >
          {items.length} kategori
        </text>
      </svg>

      {arcs.length === 0 ? (
        <p className="mt-1 rounded-xl bg-canvas px-3 py-3 text-center text-[12px] leading-relaxed text-muted">
          Belum ada {mode === "in" ? "pemasukan" : "pengeluaran"} di{" "}
          {formatMonthLabel(month)}.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {arcs.map((arc) => (
            <li key={arc.category} className="flex items-center gap-2.5 py-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                {arc.category}
              </span>
              <span className="shrink-0 text-[12px] font-semibold tabular-nums text-ink">
                {formatIDR(arc.amount)}
              </span>
              <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted">
                {arc.share}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
