import { ChevronLeft, ImagePlus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AmountField } from "../components/AmountField";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { CATEGORIES } from "../lib/categories";
import { todayISO } from "../lib/date";
import { fileToReceipt } from "../lib/image";
import { goBack, navigate } from "../lib/router";
import { useStore } from "../lib/store";
import type { TxType } from "../lib/types";

interface TransactionFormPageProps {
  transactionId?: string;
  presetType?: TxType;
}

interface FormErrors {
  amount?: string;
  category?: string;
  date?: string;
}

export function TransactionFormPage({ transactionId, presetType }: TransactionFormPageProps) {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const toast = useToast();

  const transaction = useMemo(
    () => data.transactions.find((item) => item.id === transactionId),
    [data.transactions, transactionId],
  );

  const [type, setType] = useState<TxType>(transaction?.type ?? presetType ?? "in");
  const [amount, setAmount] = useState(transaction?.amount ?? 0);
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayISO());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [receipt, setReceipt] = useState<string | undefined>(transaction?.receipt);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  if (transactionId && !transaction) {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)_+_16px)]">
        <h1 className="text-[20px] font-bold tracking-tight text-ink">Transaksi tidak ditemukan</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Catatan ini mungkin sudah dihapus, atau tautannya tidak valid.
        </p>
        <a
          href="#/transaksi"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Kembali ke daftar transaksi
        </a>
      </div>
    );
  }

  const changeType = (next: TxType) => {
    setType(next);
    setCategory((current) =>
      CATEGORIES[next].some((item) => item.name === current) ? current : "",
    );
    setErrors((current) => ({ ...current, category: undefined }));
  };

  const handleReceiptChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReceiptError(null);
    setReceiptBusy(true);
    try {
      setReceipt(await fileToReceipt(file));
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : "Foto tidak bisa diproses.");
    } finally {
      setReceiptBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (amount <= 0) nextErrors.amount = "Masukkan jumlah lebih dari Rp 0.";
    if (!category) nextErrors.category = "Pilih satu kategori.";
    if (!date) nextErrors.date = "Pilih tanggal transaksi.";

    setErrors(nextErrors);

    if (nextErrors.amount) {
      amountRef.current?.focus();
      return;
    }
    if (nextErrors.category) {
      categoryRef.current?.focus();
      return;
    }
    if (nextErrors.date) {
      dateRef.current?.focus();
      return;
    }

    const payload = { date, type, amount, category, note: note.trim(), receipt };

    if (transaction) {
      updateTransaction(transaction.id, payload);
      toast("Perubahan disimpan");
    } else {
      addTransaction(payload);
      toast("Transaksi disimpan");
    }

    navigate(transaction ? "/transaksi" : "/");
  };

  return (
    <div>
      <header className="flex items-center gap-1 px-2 pb-2 pt-[calc(env(safe-area-inset-top)_+_8px)]">
        <button
          type="button"
          onClick={() => goBack("#/")}
          aria-label="Kembali"
          className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-line/60"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="text-[16px] font-bold tracking-tight text-ink">
          {transaction ? "Ubah transaksi" : "Catat transaksi"}
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="px-4 pb-[calc(env(safe-area-inset-bottom)_+_108px)]"
      >
        <section className="mt-2">
          <h2 className="text-[13px] font-bold text-ink">Jenis transaksi</h2>
          <div
            role="group"
            aria-label="Jenis transaksi"
            className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-surface p-1.5"
          >
            {(["in", "out"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => changeType(value)}
                className={`min-h-11 rounded-lg text-[13px] transition-colors ${
                  type === value
                    ? `font-semibold text-white ${value === "in" ? "bg-income" : "bg-expense"}`
                    : "font-medium text-muted hover:bg-canvas"
                }`}
              >
                {value === "in" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4">
          <label htmlFor="amount" className="text-[13px] font-bold text-ink">
            Jumlah
          </label>
          <AmountField
            id="amount"
            value={amount}
            onChange={setAmount}
            invalid={Boolean(errors.amount)}
            tone={type === "in" ? "income" : "expense"}
            inputRef={amountRef}
          />
          {errors.amount ? (
            <p
              id="amount-error"
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-expense"
            >
              {errors.amount}
            </p>
          ) : null}
        </div>

        <section ref={categoryRef} tabIndex={-1} className="mt-4">
          <h2 className="text-[13px] font-bold text-ink">Kategori</h2>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {CATEGORIES[type].map(({ name, icon: Icon }) => {
              const selected = category === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategory(name);
                    setErrors((current) => ({ ...current, category: undefined }));
                  }}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-[13px] transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface font-medium text-ink hover:bg-canvas"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                  <span className="min-w-0 truncate">{name}</span>
                </button>
              );
            })}
          </div>
          {errors.category ? (
            <p
              id="category-error"
              role="alert"
              className="mt-1.5 text-[12px] font-medium text-expense"
            >
              {errors.category}
            </p>
          ) : null}
        </section>

        <div className="mt-4">
          <label htmlFor="date" className="text-[13px] font-bold text-ink">
            Tanggal
          </label>
          <input
            ref={dateRef}
            id="date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setErrors((current) => ({ ...current, date: undefined }));
            }}
            aria-invalid={Boolean(errors.date) || undefined}
            aria-describedby={errors.date ? "date-error" : undefined}
            className={`mt-1.5 h-12 w-full rounded-xl border bg-surface px-3 text-[16px] text-ink outline-none focus:border-brand ${
              errors.date ? "border-expense" : "border-line"
            }`}
          />
          {errors.date ? (
            <p id="date-error" role="alert" className="mt-1.5 text-[12px] font-medium text-expense">
              {errors.date}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="note" className="text-[13px] font-bold text-ink">
            Keterangan <span className="font-medium text-muted">(opsional)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Contoh: Iuran anggota bulan November"
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-muted/60 focus:border-brand"
          />
        </div>

        <section className="mt-4">
          <h2 className="text-[13px] font-bold text-ink">
            Foto nota <span className="font-medium text-muted">(opsional)</span>
          </h2>

          <input
            ref={receiptRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptChange}
            className="sr-only"
            aria-label="Pilih foto nota"
          />

          {receipt ? (
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
              <img
                src={receipt}
                alt="Pratinjau foto nota"
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">Foto nota siap disimpan</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">
                  Dikompres otomatis agar hemat ruang penyimpanan.
                </p>
                <button
                  type="button"
                  onClick={() => receiptRef.current?.click()}
                  className="mt-1 min-h-11 text-[12px] font-semibold text-brand"
                >
                  Ganti foto
                </button>
              </div>
              <button
                type="button"
                onClick={() => setReceipt(undefined)}
                aria-label="Hapus foto nota"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-expense transition-colors hover:bg-expense-soft"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => receiptRef.current?.click()}
              disabled={receiptBusy}
              className="mt-1.5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface text-[13px] font-semibold text-brand transition-colors hover:bg-brand-soft disabled:opacity-60"
            >
              <ImagePlus size={17} aria-hidden="true" />
              {receiptBusy ? "Memproses foto…" : "Ambil atau pilih foto"}
            </button>
          )}

          {receiptError ? (
            <p role="alert" className="mt-1.5 text-[12px] font-medium text-expense">
              {receiptError}
            </p>
          ) : null}

          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Foto disimpan bersama transaksi di perangkat ini, dan bisa dilihat lewat ikon mata.
          </p>
        </section>

        {transaction ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[12px] leading-relaxed text-muted">
              Transaksi yang dihapus tidak bisa dikembalikan.
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-expense"
            >
              <Trash2 size={16} aria-hidden="true" />
              Hapus transaksi
            </button>
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-line bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)_+_12px)] pt-3">
          <button
            type="submit"
            disabled={receiptBusy}
            className="h-12 w-full rounded-xl bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-strong active:brightness-95 disabled:opacity-60"
          >
            {receiptBusy
              ? "Memproses foto…"
              : transaction
                ? "Simpan perubahan"
                : "Simpan transaksi"}
          </button>
        </div>
      </form>

      {transaction ? (
        <ConfirmDialog
          open={confirmDelete}
          title="Hapus transaksi?"
          description="Catatan ini akan dihapus dari kas. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Hapus"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteTransaction(transaction.id);
            setConfirmDelete(false);
            toast("Transaksi dihapus");
            navigate("/transaksi");
          }}
        />
      ) : null}
    </div>
  );
}
