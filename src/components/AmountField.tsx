import type { RefObject } from "react";
import { digitsToAmount, formatNumber } from "../lib/format";

interface AmountFieldProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
  tone?: "income" | "expense";
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function AmountField({ id, value, onChange, invalid, tone = "income", inputRef }: AmountFieldProps) {
  return (
    <div
      className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-surface px-3 py-2 focus-within:border-brand ${
        invalid ? "border-expense" : "border-line"
      }`}
    >
      <span aria-hidden="true" className="text-[16px] font-semibold text-muted">
        Rp
      </span>
      <input
        ref={inputRef}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value > 0 ? formatNumber(value) : ""}
        onChange={(event) => onChange(digitsToAmount(event.target.value))}
        placeholder="0"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={`w-full min-w-0 bg-transparent text-[26px] font-bold leading-tight tracking-tight tabular-nums outline-none placeholder:text-muted/50 ${
          tone === "income" ? "text-income" : "text-expense"
        }`}
      />
    </div>
  );
}
