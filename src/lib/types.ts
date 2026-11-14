export type TxType = "in" | "out";

export interface Transaction {
  id: string;
  /** Tanggal transaksi, format YYYY-MM-DD. */
  date: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  /** Foto nota dalam bentuk data URL yang sudah dikompres. */
  receipt?: string;
  createdAt: string;
}

export interface AppSettings {
  orgName: string;
}

export interface AppData {
  version: 1;
  transactions: Transaction[];
  settings: AppSettings;
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
