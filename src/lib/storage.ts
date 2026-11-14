import { createId } from "./sample";
import { toISODate, parseISODate } from "./date";
import type { AppData, Transaction } from "./types";

export const DEFAULT_ORG_NAME = "Remaja Masjid Al-Husna";
const STORAGE_KEY = "kas-alhusna:v1";
const MAX_RECEIPT_CHARS = 1_200_000;

export const EMPTY_DATA: AppData = {
  version: 1,
  transactions: [],
  settings: { orgName: DEFAULT_ORG_NAME },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toReceipt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("data:image/")) return undefined;
  return value.length <= MAX_RECEIPT_CHARS ? value : undefined;
}

function toTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) return null;

  const { date, type, amount, category, note, id, createdAt, receipt } = value;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  // Pastikan tanggalnya benar-benar ada (bukan 2024-02-31 dan sebagainya).
  try {
    if (toISODate(parseISODate(date)) !== date) return null;
  } catch {
    return null;
  }
  if (type !== "in" && type !== "out") return null;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;

  return {
    id: typeof id === "string" && id ? id : createId(),
    date,
    type,
    amount: Math.round(numericAmount),
    category:
      typeof category === "string" && category.trim()
        ? category.trim().slice(0, 60)
        : "Lainnya",
    note: typeof note === "string" ? note.slice(0, 200) : "",
    receipt: toReceipt(receipt),
    createdAt:
      typeof createdAt === "string" && !Number.isNaN(Date.parse(createdAt))
        ? createdAt
        : new Date().toISOString(),
  };
}

export function normalizeData(input: unknown): AppData {
  if (!isRecord(input)) {
    throw new Error("Berkas tidak dikenali. Pakai berkas JSON hasil ekspor aplikasi ini.");
  }
  if (!Array.isArray(input.transactions)) {
    throw new Error("Berkas tidak memuat daftar transaksi.");
  }

  const mapped = input.transactions
    .map(toTransaction)
    .filter((transaction): transaction is Transaction => transaction !== null);

  // Hindari id duplikat yang bisa memicu kunci React berulang saat impor.
  const seen = new Set<string>();
  const transactions = mapped.filter((transaction) => {
    if (seen.has(transaction.id)) return false;
    seen.add(transaction.id);
    return true;
  });

  const settings = isRecord(input.settings) ? input.settings : {};
  const orgName =
    typeof settings.orgName === "string" && settings.orgName.trim()
      ? settings.orgName.trim().slice(0, 80)
      : DEFAULT_ORG_NAME;

  return { version: 1, transactions, settings: { orgName } };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    return normalizeData(JSON.parse(raw));
  } catch {
    return EMPTY_DATA;
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function createExportFile(data: AppData): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}
