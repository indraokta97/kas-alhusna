import { Eye, Trash2 } from "lucide-react";
import { categoryIcon } from "../lib/categories";
import { formatDateShort } from "../lib/date";
import { formatIDR } from "../lib/format";
import type { Transaction } from "../lib/types";

interface TransactionRowProps {
  transaction: Transaction;
  /** Tanpa handler, baris tampil sebagai daftar biasa (mode lihat). */
  onSelect?: (id: string) => void;
  onViewReceipt?: (transaction: Transaction) => void;
  /** Tanpa handler, tombol hapus tidak tampil (mode lihat). */
  onDelete?: (transaction: Transaction) => void;
  showDate?: boolean;
}

export function TransactionRow({
  transaction,
  onSelect,
  onViewReceipt,
  onDelete,
  showDate = true,
}: TransactionRowProps) {
  const Icon = categoryIcon(transaction.category);
  const isIncome = transaction.type === "in";
  const title = transaction.note || transaction.category;
  const bodyClass = "flex min-h-[56px] min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left";

  const body = (
    <>
      <span
        aria-hidden="true"
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
        }`}
      >
        <Icon size={18} strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-tight text-ink">
          {title}
        </span>
        <span className="mt-1 block truncate text-[12px] leading-tight text-muted">
          {transaction.category}
          {showDate ? ` · ${formatDateShort(transaction.date)}` : ""}
        </span>
      </span>

      <span
        className={`shrink-0 whitespace-nowrap text-[clamp(12px,3.6vw,14px)] font-bold tabular-nums ${
          isIncome ? "text-income" : "text-expense"
        }`}
      >
        {isIncome ? "+" : "−"}
        {formatIDR(transaction.amount)}
      </span>
    </>
  );

  const hasActions = Boolean(onDelete || (transaction.receipt && onViewReceipt));

  return (
    <div className={`flex items-center ${hasActions ? "pr-1.5" : ""}`}>
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(transaction.id)}
          className={`${bodyClass} transition-colors hover:bg-canvas active:bg-line/40`}
        >
          {body}
        </button>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}

      {hasActions ? (
        <div className="flex shrink-0 items-center gap-0.5">
          {transaction.receipt && onViewReceipt ? (
            <button
              type="button"
              onClick={() => onViewReceipt(transaction)}
              aria-label={`Lihat foto nota ${title}`}
              title="Lihat foto nota"
              className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-brand-soft hover:text-brand"
            >
              <Eye size={18} aria-hidden="true" />
            </button>
          ) : null}

          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              aria-label={`Hapus transaksi ${title}`}
              title="Hapus transaksi"
              className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-expense-soft hover:text-expense"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
