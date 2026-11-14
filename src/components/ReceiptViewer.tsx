import { useRef } from "react";
import { X } from "lucide-react";
import { formatDateLong } from "../lib/date";
import { formatIDR } from "../lib/format";
import { useDialogFocus } from "../lib/useDialogFocus";
import type { Transaction } from "../lib/types";

interface ReceiptViewerProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ReceiptViewer({ transaction, onClose }: ReceiptViewerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(
    Boolean(transaction?.receipt),
    onClose,
    closeRef,
  );

  if (!transaction?.receipt) return null;

  const title = transaction.note || transaction.category;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Foto nota: ${title}`}
        tabIndex={-1}
        className="flex max-h-[92dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-surface outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
            <p className="text-[11px] text-muted">
              {formatDateLong(transaction.date)} · {transaction.type === "in" ? "+" : "−"}
              {formatIDR(transaction.amount)}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup foto nota"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-canvas"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-canvas p-2">
          <img
            src={transaction.receipt}
            alt={`Foto nota ${title}`}
            className="mx-auto h-auto w-full rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
