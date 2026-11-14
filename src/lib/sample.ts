import { shiftISODate, todayISO } from "./date";
import type { Transaction } from "./types";

/**
 * Data contoh untuk mencoba aplikasi. Tidak pernah dimuat otomatis;
 * pengguna memilih sendiri dari halaman Pengaturan dan bisa menghapusnya.
 */
export function buildSampleTransactions(): Transaction[] {
  const today = todayISO();
  const rows: Array<Omit<Transaction, "id" | "createdAt">> = [
    {
      date: shiftISODate(today, -1),
      type: "in",
      amount: 350_000,
      category: "Iuran Anggota",
      note: "Iuran anggota bulan ini, 7 orang",
    },
    {
      date: shiftISODate(today, -3),
      type: "out",
      amount: 120_000,
      category: "Konsumsi",
      note: "Konsumsi rapat pengurus",
    },
    {
      date: shiftISODate(today, -5),
      type: "in",
      amount: 250_000,
      category: "Infaq & Donasi",
      note: "Infaq Jumat",
    },
    {
      date: shiftISODate(today, -8),
      type: "out",
      amount: 75_000,
      category: "Perlengkapan",
      note: "Kertas dan tinta untuk pengumuman",
    },
    {
      date: shiftISODate(today, -11),
      type: "in",
      amount: 500_000,
      category: "Sponsorship",
      note: "Sponsor kegiatan santunan",
    },
    {
      date: shiftISODate(today, -14),
      type: "out",
      amount: 210_000,
      category: "Kegiatan & Acara",
      note: "Sewa tenda kajian bulanan",
    },
    {
      date: shiftISODate(today, -18),
      type: "out",
      amount: 45_000,
      category: "Transport",
      note: "Transport pengambilan donasi",
    },
    {
      date: shiftISODate(today, -22),
      type: "out",
      amount: 90_000,
      category: "Operasional",
      note: "Cetak buku kas",
    },
  ];

  return rows.map((row) => ({
    ...row,
    id: createId(),
    createdAt: new Date().toISOString(),
  }));
}

export function createId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
