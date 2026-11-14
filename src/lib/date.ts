const pad = (value: number) => String(value).padStart(2, "0");

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function shiftISODate(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthOf(todayISO());
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", options).format(parseISODate(iso));
}

export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(year, monthIndex - 1, 1),
  );
}

export function formatMonthShort(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(year, monthIndex - 1, 1),
  );
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "long", year: "numeric" });
}

export function formatGroupDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return `Hari ini, ${formatDateShort(iso)}`;
  if (iso === shiftISODate(today, -1)) return `Kemarin, ${formatDateShort(iso)}`;
  return formatDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Hari terakhir pada sebuah bulan, dalam format YYYY-MM-DD. */
export function lastDayOfMonth(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex, 0);
  return toISODate(date);
}
