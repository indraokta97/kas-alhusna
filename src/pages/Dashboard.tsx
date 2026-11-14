import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChartColumn, Lock, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ReceiptViewer } from "../components/ReceiptViewer";
import { TransactionRow } from "../components/TransactionRow";
import { useAuth } from "../lib/auth";
import {
  currentMonthKey,
  formatDateLong,
  formatMonthShort,
  todayISO,
} from "../lib/date";
import { formatCompactIDR, formatIDR } from "../lib/format";
import { navigate } from "../lib/router";
import { balanceUntil, inMonth, sortTransactions, summarize } from "../lib/summary";
import { useStore } from "../lib/store";
import type { Transaction } from "../lib/types";

const bendaharaActions = [
  { label: "Pemasukan", href: "#/catat?jenis=in", icon: ArrowDownLeft, tone: "text-income" },
  { label: "Pengeluaran", href: "#/catat?jenis=out", icon: ArrowUpRight, tone: "text-expense" },
  { label: "Laporan", href: "#/laporan", icon: ChartColumn, tone: "text-brand" },
];

const guestActions = [
  { label: "Transaksi", href: "#/transaksi", icon: ArrowLeftRight, tone: "text-brand" },
  { label: "Laporan", href: "#/laporan", icon: ChartColumn, tone: "text-brand" },
];

export function Dashboard() {
  const { data } = useStore();
  const { isBendahara, openLogin } = useAuth();
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const month = currentMonthKey();

  const monthTotals = useMemo(() => summarize(inMonth(data.transactions, month)), [data.transactions, month]);
  const totalBalance = useMemo(() => balanceUntil(data.transactions), [data.transactions]);
  const recent = useMemo(() => sortTransactions(data.transactions).slice(0, 5), [data.transactions]);
  const hasData = data.transactions.length > 0;
  const actions = isBendahara ? bendaharaActions : guestActions;

  return (
    <div className="overflow-hidden">
      <header className="relative overflow-hidden rounded-b-[26px] bg-brand px-5 pb-4 pt-[calc(env(safe-area-inset-top)_+_12px)] text-white">
        <img
          src="/hero.jpeg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand/55" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 truncate text-[13px] font-semibold text-white/95">
              {data.settings.orgName}
            </h1>
            {isBendahara ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                <ShieldCheck size={13} aria-hidden="true" />
                Bendahara
              </span>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink/30 px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-ink/45"
              >
                <Lock size={14} aria-hidden="true" />
                Masuk
              </button>
            )}
          </div>

          <p className="mt-4 text-[13px] font-medium text-white/95">Saldo kas</p>
          <p className="mt-1 break-words text-[clamp(22px,7vw,32px)] font-bold leading-none tracking-tight tabular-nums">
            {formatIDR(totalBalance)}
          </p>
          <p className="mt-2 text-[12px] text-white/95">Dari seluruh transaksi yang tercatat</p>

          <div className="mt-5 grid grid-cols-2 divide-x divide-white/20">
            <div className="min-w-0 pr-4">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/95">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#7ee2b5]" />
                Masuk · {formatMonthShort(month)}
              </p>
              <p className="mt-1 truncate text-[14px] font-bold tabular-nums">
                {formatCompactIDR(monthTotals.income)}
              </p>
            </div>
            <div className="min-w-0 pl-4">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/95">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#ff9d93]" />
                Keluar · {formatMonthShort(month)}
              </p>
              <p className="mt-1 truncate text-[14px] font-bold tabular-nums">
                {formatCompactIDR(monthTotals.expense)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mt-2 px-4">
        <div
          className={`grid gap-0.5 rounded-2xl border border-line bg-surface p-1 shadow-[0_12px_28px_-20px_rgba(13,27,42,0.55)] ${
            actions.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {actions.map(({ label, href, icon: Icon, tone }) => (
            <a
              key={label}
              href={href}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-semibold text-ink transition-colors hover:bg-canvas active:bg-line/40"
            >
              <Icon size={20} strokeWidth={1.9} className={tone} aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {!hasData ? (
        <section className="mt-4 px-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <EmptyState
              image="/ropik-2.webp"
              title="Belum ada catatan kas"
              description={
                isBendahara
                  ? "Mulai dari pemasukan pertama, misalnya iuran anggota bulan ini. Data contoh bisa dimuat di halaman Pengaturan."
                  : "Belum ada catatan kas yang bisa dilihat. Masuk sebagai bendahara untuk mulai mencatat pemasukan dan pengeluaran."
              }
              action={
                isBendahara ? (
                  <a
                    href="#/catat"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
                  >
                    <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
                    Catat transaksi
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
                  >
                    <Lock size={15} aria-hidden="true" />
                    Masuk sebagai bendahara
                  </button>
                )
              }
            />
          </div>
        </section>
      ) : (
        <section className="mt-0 px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight text-ink">Transaksi terakhir</h2>
            <a
              href="#/transaksi"
              className="-mr-2 inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-brand"
            >
              Lihat semua
            </a>
          </div>
          <div className="mt-2.5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {recent.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onSelect={isBendahara ? (id) => navigate(`/ubah/${id}`) : undefined}
                onViewReceipt={setReceipt}
              />
            ))}
          </div>
          <p className="hidden text-center text-[11px] text-muted">
            Saldo per {formatDateLong(todayISO())}
            {isBendahara ? "" : " · mode lihat"}
          </p>
        </section>
      )}

      {hasData ? (
        <div className={`mt-0 flex justify-center px-4 ${isBendahara ? "mb-0" : "mb-0"}`}>
          <img
            src="/ropik-2.webp"
            alt=""
            aria-hidden="true"
            width={478}
            height={508}
            className="h-24 w-auto object-contain"
            style={{ clipPath: "inset(0 0 12% 0)" }}
          />
        </div>
      ) : null}

      <ReceiptViewer transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
