import { Lock, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { MonthSwitcher } from "../components/MonthSwitcher";
import { ReceiptViewer } from "../components/ReceiptViewer";
import { useToast } from "../components/Toast";
import { TransactionRow } from "../components/TransactionRow";
import { useAuth } from "../lib/auth";
import { currentMonthKey, formatGroupDate, formatMonthLabel } from "../lib/date";
import { navigate } from "../lib/router";
import { groupByDate, inMonth, sortTransactions } from "../lib/summary";
import { useStore } from "../lib/store";
import type { Transaction, TxType } from "../lib/types";

type Filter = "all" | TxType;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "in", label: "Masuk" },
  { value: "out", label: "Keluar" },
];

export function TransactionsPage() {
  const { data, deleteTransaction } = useStore();
  const { isBendahara, openLogin } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(currentMonthKey);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const monthTransactions = useMemo(
    () => sortTransactions(inMonth(data.transactions, month)),
    [data.transactions, month],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return monthTransactions.filter((transaction) => {
      if (filter !== "all" && transaction.type !== filter) return false;
      if (!keyword) return true;
      return `${transaction.note} ${transaction.category}`.toLowerCase().includes(keyword);
    });
  }, [monthTransactions, filter, query]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const filtersActive = filter !== "all" || query.trim() !== "";

  const resetFilters = () => {
    setFilter("all");
    setQuery("");
  };

  return (
    <div>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)_+_16px)]">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Transaksi</h1>
          <p className="shrink-0 text-[12px] font-medium text-muted">
            {monthTransactions.length} catatan
          </p>
        </div>

        <div className="mt-3">
          <MonthSwitcher month={month} onChange={setMonth} />
        </div>

        <div className="relative mt-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="transaction-search"
            type="search"
            aria-label="Cari transaksi"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari keterangan atau kategori"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-[16px] text-ink outline-none placeholder:text-[14px] placeholder:text-muted/70 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-muted"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="mt-2 flex gap-2" role="group" aria-label="Filter jenis transaksi">
          {FILTERS.map((option) => {
            const active = filter === option.value;
            const activeTone =
              option.value === "in"
                ? "border-income bg-income"
                : option.value === "out"
                  ? "border-expense bg-expense"
                  : "border-brand bg-brand";
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.value)}
                className={`min-h-11 rounded-lg border px-4 text-[12px] transition-colors ${
                  active
                    ? `${activeTone} font-semibold text-white`
                    : "border-line bg-surface font-medium text-muted hover:bg-canvas"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 pb-4">
        {monthTransactions.length === 0 ? (
          <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-line bg-surface">
            <EmptyState
              image="/ropik-2.webp"
              title={`Belum ada catatan di ${formatMonthLabel(month)}`}
              description="Setiap pemasukan dan pengeluaran yang dicatat akan muncul di sini."
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
        ) : filtered.length === 0 ? (
          <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-line bg-surface">
            <EmptyState
              icon={Search}
              title="Tidak ada yang cocok"
              description="Coba kata kunci lain, atau kembalikan filter ke semua transaksi."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-11 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
                >
                  Reset filter
                </button>
              }
            />
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.date} className="mt-4">
              <h2 className="px-4 pb-1.5 text-[11px] font-semibold text-muted">
                {formatGroupDate(group.date)}
              </h2>
              <div className="mx-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {group.items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    showDate={false}
                    onSelect={isBendahara ? (id) => navigate(`/ubah/${id}`) : undefined}
                    onViewReceipt={setReceipt}
                    onDelete={isBendahara ? setPendingDelete : undefined}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {filtersActive && filtered.length > 0 ? (
          <p className="mt-3 px-4 text-center text-[11px] text-muted">
            Menampilkan {filtered.length} dari {monthTransactions.length} catatan
          </p>
        ) : null}
      </div>

      <ReceiptViewer transaction={receipt} onClose={() => setReceipt(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus transaksi?"
        description="Catatan ini akan dihapus dari kas. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteTransaction(pendingDelete.id);
            toast("Transaksi dihapus");
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
