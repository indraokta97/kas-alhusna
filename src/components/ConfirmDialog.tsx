import { useId, useRef } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(open, onCancel, cancelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/45">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onCancel();
        }}
      >
        <div
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="my-auto w-full max-w-[400px] rounded-2xl bg-surface p-5 shadow-xl outline-none"
        >
          <h2 id={titleId} className="text-[17px] font-bold tracking-tight text-ink">
            {title}
          </h2>
          <p id={descriptionId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {description}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-xl border border-line bg-surface text-[14px] font-semibold text-ink transition-colors hover:bg-canvas active:bg-line/60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`min-h-11 rounded-xl text-[14px] font-semibold text-white transition-colors ${
                destructive ? "bg-expense hover:brightness-95" : "bg-brand hover:bg-brand-strong"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
