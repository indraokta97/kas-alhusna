import { useMemo, useState } from "react";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import { MonthlyFlowChart } from "../components/charts/MonthlyFlowChart";
import { MonthSwitcher } from "../components/MonthSwitcher";
import { currentMonthKey, formatMonthLabel, lastDayOfMonth } from "../lib/date";
import { formatIDR } from "../lib/format";
import { balanceUntil, categoryBreakdown, inMonth, summarize } from "../lib/summary";
import { useStore } from "../lib/store";

export function ReportPage() {
  const { data } = useStore();
  const [month, setMonth] = useState(currentMonthKey);

  const monthTransactions = useMemo(
    () => inMonth(data.transactions, month),
    [data.transactions, month],
  );
  const totals = useMemo(() => summarize(monthTransactions), [monthTransactions]);
  const income = useMemo(() => categoryBreakdown(monthTransactions, "in"), [monthTransactions]);
  const expense = useMemo(() => categoryBreakdown(monthTransactions, "out"), [monthTransactions]);
  const closingBalance = useMemo(
    () => balanceUntil(data.transactions, lastDayOfMonth(month)),
    [data.transactions, month],
  );

  return (
    <div className="pb-6">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)_+_16px)]">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Laporan</h1>
        <p className="mt-0.5 text-[12px] text-muted">Rekap kas per bulan</p>
        <div className="mt-3">
          <MonthSwitcher month={month} onChange={setMonth} />
        </div>
      </div>

      <section className="mx-4 mt-4 rounded-2xl border border-line bg-surface px-4">
        <dl className="divide-y divide-line">
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-muted">Pemasukan</dt>
            <dd className="text-right text-[15px] font-bold tabular-nums text-income">
              {formatIDR(totals.income)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-muted">Pengeluaran</dt>
            <dd className="text-right text-[15px] font-bold tabular-nums text-expense">
              {formatIDR(totals.expense)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-muted">Selisih bulan ini</dt>
            <dd
              className={`text-right text-[14px] font-bold tabular-nums ${
                totals.net < 0 ? "text-expense" : "text-income"
              }`}
            >
              {totals.net < 0 ? "−" : ""}
              {formatIDR(Math.abs(totals.net))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-muted">Saldo per akhir bulan</dt>
            <dd className="text-right text-[13px] font-semibold tabular-nums text-ink">
              {formatIDR(closingBalance)}
            </dd>
          </div>
        </dl>
      </section>

      <MonthlyFlowChart transactions={data.transactions} month={month} />
      <CategoryDonut income={income} expense={expense} month={month} />

      <div className="mt-5 px-4">
        <a
          href="#/transaksi"
          className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface text-[13px] font-semibold text-brand transition-colors hover:bg-brand-soft"
        >
          Lihat rincian transaksi {formatMonthLabel(month)}
        </a>
      </div>
    </div>
  );
}
