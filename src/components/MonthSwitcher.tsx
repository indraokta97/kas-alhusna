import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthKey, formatMonthLabel, shiftMonth } from "../lib/date";

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const isCurrentMonth = month >= currentMonthKey();

  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-1.5 py-1">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Bulan sebelumnya"
        className="grid h-11 w-11 place-items-center rounded-lg text-ink transition-colors hover:bg-canvas active:bg-line/50"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <p className="px-2 text-center text-[13px] font-semibold text-ink" aria-live="polite">
        {formatMonthLabel(month)}
      </p>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentMonth}
        aria-label="Bulan berikutnya"
        className="grid h-11 w-11 place-items-center rounded-lg text-ink transition-colors hover:bg-canvas active:bg-line/50 disabled:text-muted disabled:opacity-50"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
