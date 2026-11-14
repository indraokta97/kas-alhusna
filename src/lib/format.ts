const numberFormat = new Intl.NumberFormat("id-ID");

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return numberFormat.format(Math.round(value));
}

/** Rupiah utuh, dipakai di saldo dan daftar transaksi. */
export function formatIDR(value: number): string {
  return `Rp ${formatNumber(value)}`;
}

/** Versi pendek untuk ruang sempit, mis. Rp 1,25 jt. */
export function formatCompactIDR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${numberFormat.format(Number((abs / 1_000_000_000).toFixed(2)))} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${numberFormat.format(Number((abs / 1_000_000).toFixed(2)))} jt`;
  }
  if (abs >= 10_000) {
    return `${sign}Rp ${numberFormat.format(Math.round(abs / 1_000))} rb`;
  }
  return formatIDR(value);
}

/** Hanya digit, dipakai oleh input nominal. */
export function digitsToAmount(input: string): number {
  const digits = input.replace(/\D/g, "").slice(0, 12);
  return digits ? Number(digits) : 0;
}
