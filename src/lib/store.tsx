import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadData, saveData, EMPTY_DATA } from "./storage";
import { buildSampleTransactions, createId } from "./sample";
import type { AppData, Transaction, TransactionInput } from "./types";

interface StoreValue {
  data: AppData;
  saveFailed: boolean;
  addTransaction: (input: TransactionInput) => string;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  setOrgName: (name: string) => void;
  replaceData: (data: AppData) => void;
  loadSample: () => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [saveFailed, setSaveFailed] = useState(false);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    setSaveFailed(!saveData(data));
  }, [data]);

  const addTransaction = useCallback((input: TransactionInput) => {
    const id = createId();
    const transaction: Transaction = { ...input, id, createdAt: new Date().toISOString() };
    setData((current) => ({
      ...current,
      transactions: [transaction, ...current.transactions],
    }));
    return id;
  }, []);

  const updateTransaction = useCallback((id: string, input: TransactionInput) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...input } : transaction,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }));
  }, []);

  const setOrgName = useCallback((name: string) => {
    const orgName = name.trim().slice(0, 80);
    setData((current) => ({
      ...current,
      settings: { ...current.settings, orgName: orgName || current.settings.orgName },
    }));
  }, []);

  const replaceData = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const loadSample = useCallback(() => {
    setData((current) => ({
      ...current,
      transactions: [...buildSampleTransactions(), ...current.transactions],
    }));
  }, []);

  const clearAll = useCallback(() => {
    setData(EMPTY_DATA);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      saveFailed,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setOrgName,
      replaceData,
      loadSample,
      clearAll,
    }),
    [
      data,
      saveFailed,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setOrgName,
      replaceData,
      loadSample,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return store;
}
