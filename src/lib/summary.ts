import type { Transaction, TxType } from "./types";

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
  count: number;
  incomeCount: number;
  expenseCount: number;
}

export function summarize(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const transaction of transactions) {
    if (transaction.type === "in") {
      income += transaction.amount;
      incomeCount += 1;
    } else {
      expense += transaction.amount;
      expenseCount += 1;
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    count: transactions.length,
    incomeCount,
    expenseCount,
  };
}

/** Saldo kumulatif; batasi dengan tanggal (YYYY-MM-DD) untuk laporan per bulan. */
export function balanceUntil(transactions: Transaction[], untilDate?: string): number {
  return transactions.reduce((total, transaction) => {
    if (untilDate && transaction.date > untilDate) return total;
    return total + (transaction.type === "in" ? transaction.amount : -transaction.amount);
  }, 0);
}

export function inMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((transaction) => transaction.date.startsWith(month));
}

export interface DateGroup {
  date: string;
  items: Transaction[];
}

export function groupByDate(transactions: Transaction[]): DateGroup[] {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of sortTransactions(transactions)) {
    const existing = groups.get(transaction.date);
    if (existing) existing.push(transaction);
    else groups.set(transaction.date, [transaction]);
  }

  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

export interface CategoryTotal {
  category: string;
  amount: number;
  share: number;
}

export function categoryBreakdown(
  transactions: Transaction[],
  type: TxType,
): CategoryTotal[] {
  const filtered = transactions.filter((transaction) => transaction.type === type);
  const total = filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
  const perCategory = new Map<string, number>();

  for (const transaction of filtered) {
    perCategory.set(
      transaction.category,
      (perCategory.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  return [...perCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
