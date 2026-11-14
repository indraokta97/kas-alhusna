import {
  ChevronRight,
  Download,
  Info,
  Lock,
  LogOut,
  Plus,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { useAuth } from "../lib/auth";
import { todayISO } from "../lib/date";
import { createExportFile, normalizeData, DEFAULT_ORG_NAME } from "../lib/storage";
import { useStore } from "../lib/store";
import type { AppData } from "../lib/types";

interface DataRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}

function DataRow({ icon: Icon, title, description, onClick, disabled, tone = "default" }: DataRowProps) {
  const isDanger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas active:bg-line/40 disabled:opacity-45 disabled:hover:bg-transparent"
    >
      <span
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          isDanger ? "bg-expense-soft text-expense" : "bg-brand-soft text-brand"
        }`}
      >
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] font-semibold ${isDanger ? "text-expense" : "text-ink"}`}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{description}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
    </button>
  );
}

function LoginButton({ label = "Masuk sebagai bendahara" }: { label?: string }) {
  const { openLogin } = useAuth();
  return (
    <button
      type="button"
      onClick={openLogin}
      className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
    >
      <Lock size={15} aria-hidden="true" />
      {label}
    </button>
  );
}

type ConfirmKind = "clear" | "sample" | "import";

export function SettingsPage() {
  const { data, setOrgName, replaceData, loadSample, clearAll } = useStore();
  const { isBendahara, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(data.settings.orgName);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasData = data.transactions.length > 0;
  const nameChanged = name.trim() !== "" && name.trim() !== data.settings.orgName;

  useEffect(() => {
    setName(data.settings.orgName);
  }, [data.settings.orgName]);

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nameChanged) return;
    setOrgName(name);
    toast("Nama lembaga disimpan");
  };

  const handleExport = () => {
    if (!hasData) {
      toast("Belum ada transaksi untuk diekspor");
      return;
    }
    const url = URL.createObjectURL(createExportFile(data));
    const link = document.createElement("a");
    link.href = url;
    link.download = `kas-alhusna-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Berkas cadangan diunduh");
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportError("Berkas bukan JSON yang valid.");
      return;
    }

    try {
      setPendingImport(normalizeData(parsed));
      setConfirmKind("import");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Berkas tidak bisa dibaca.");
    }
  };

  const handleSample = () => {
    if (hasData) {
      setConfirmKind("sample");
      return;
    }
    loadSample();
    toast("8 transaksi contoh ditambahkan");
  };

  const handleConfirm = () => {
    if (confirmKind === "clear") {
      clearAll();
      setName(DEFAULT_ORG_NAME);
      toast("Semua data dihapus");
    } else if (confirmKind === "sample") {
      loadSample();
      toast("8 transaksi contoh ditambahkan");
    } else if (confirmKind === "import" && pendingImport) {
      replaceData(pendingImport);
      toast("Data berhasil diimpor");
    }
    setConfirmKind(null);
    setPendingImport(null);
  };

  const confirmCopy = {
    clear: {
      title: "Hapus semua data?",
      description:
        "Seluruh catatan transaksi di perangkat ini akan dihapus. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus data",
      destructive: true,
    },
    sample: {
      title: "Tambah data contoh?",
      description:
        "8 transaksi contoh akan ditambahkan ke data saat ini. Transaksi contoh bisa dihapus satu per satu.",
      confirmLabel: "Tambahkan",
      destructive: false,
    },
    import: {
      title: "Ganti data dengan berkas ini?",
      description: `Berkas berisi ${pendingImport?.transactions.length ?? 0} transaksi. Data yang ada saat ini akan diganti.`,
      confirmLabel: "Ganti data",
      destructive: true,
    },
  } as const;

  const receiptCount = data.transactions.filter((transaction) => transaction.receipt).length;

  return (
    <div className="pb-6">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)_+_16px)]">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Pengaturan</h1>
        <p className="mt-0.5 text-[12px] text-muted">Identitas lembaga dan cadangan data</p>
      </div>

      <section className="mx-4 mt-5">
        <h2 className="text-[13px] font-bold text-ink">Identitas</h2>

        {isBendahara ? (
          <form
            onSubmit={handleNameSubmit}
            className="mt-2 rounded-2xl border border-line bg-surface p-4"
          >
            <label htmlFor="org-name" className="text-[12px] font-semibold text-muted">
              Nama lembaga
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[16px] text-ink outline-none focus:border-brand"
            />
            <p className="mt-1.5 text-[11px] text-muted">Ditampilkan di halaman ringkasan.</p>
            <button
              type="submit"
              disabled={!nameChanged}
              className="mt-3 min-h-11 w-full rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong disabled:bg-line disabled:text-muted"
            >
              Simpan nama
            </button>
          </form>
        ) : (
          <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-brand" aria-hidden="true" />
              <p className="text-[13px] font-bold text-ink">Mode lihat</p>
            </div>
            <p className="mt-2 text-[14px] font-semibold text-ink">{data.settings.orgName}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Saldo, transaksi, dan laporan bisa dilihat siapa saja. Mengubah nama lembaga hanya
              bisa dilakukan bendahara.
            </p>
            <LoginButton />
          </div>
        )}
      </section>

      <section className="mx-4 mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[13px] font-bold text-ink">Data</h2>
          <span className="text-[11px] font-medium text-muted">
            {data.transactions.length} transaksi
          </span>
        </div>

        {isBendahara ? (
          <>
            <div className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              <DataRow
                icon={Download}
                title="Ekspor data"
                description="Unduh semua transaksi sebagai berkas JSON."
                onClick={handleExport}
                disabled={!hasData}
              />
              <DataRow
                icon={Upload}
                title="Impor data"
                description="Ganti data dengan berkas hasil ekspor."
                onClick={() => fileInputRef.current?.click()}
              />
              <DataRow
                icon={Plus}
                title="Tambah data contoh"
                description="Tambahkan 8 transaksi contoh untuk latihan."
                onClick={handleSample}
              />
              <DataRow
                icon={Trash2}
                title="Hapus semua data"
                description="Hapus seluruh transaksi di perangkat ini."
                onClick={() => setConfirmKind("clear")}
                disabled={!hasData}
                tone="danger"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Pilih berkas JSON untuk diimpor"
            />

            {importError ? (
              <p
                role="alert"
                className="mt-2 rounded-xl bg-expense-soft px-3 py-2 text-[12px] leading-snug text-expense"
              >
                {importError}
              </p>
            ) : null}

            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Data disimpan di browser perangkat ini, bukan di server. Ekspor berkas JSON secara
              berkala sebagai cadangan.
              {receiptCount > 0
                ? ` ${receiptCount} transaksi punya foto nota; fotonya ikut di berkas ekspor.`
                : ""}
            </p>
          </>
        ) : (
          <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-ink">
              {data.transactions.length} transaksi tersimpan
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Ekspor, impor, dan hapus data hanya tersedia dalam mode bendahara.
            </p>
            <LoginButton />
          </div>
        )}
      </section>

      {isBendahara ? (
        <section className="mx-4 mt-5">
          <h2 className="text-[13px] font-bold text-ink">Sesi bendahara</h2>
          <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[12px] leading-relaxed text-muted">
              Mode catat aktif di tab ini. Sesi berakhir saat tab ditutup, dan PIN diminta lagi
              untuk membukanya.
            </p>
            <button
              type="button"
              onClick={() => {
                logout();
                toast("Mode bendahara ditutup");
              }}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
            >
              <LogOut size={16} aria-hidden="true" />
              Keluar
            </button>
          </div>
        </section>
      ) : null}

      <section className="mx-4 mt-5 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2 text-ink">
          <Info size={16} className="text-brand" aria-hidden="true" />
          <h2 className="text-[13px] font-bold">Tentang aplikasi</h2>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Kas Al-Husna membantu bendahara Remaja Masjid Al-Husna mencatat pemasukan dan
          pengeluaran, memantau saldo, dan menyusun laporan bulanan. Pengunjung bisa melihat
          tanpa mengubah data.
        </p>
        <p className="mt-2 text-[11px] text-muted">Versi 1.4.0 · Tanpa server · PIN lokal</p>
      </section>

      <ConfirmDialog
        open={confirmKind !== null}
        title={confirmKind ? confirmCopy[confirmKind].title : ""}
        description={confirmKind ? confirmCopy[confirmKind].description : ""}
        confirmLabel={confirmKind ? confirmCopy[confirmKind].confirmLabel : "Lanjutkan"}
        destructive={confirmKind ? confirmCopy[confirmKind].destructive : false}
        onCancel={() => {
          setConfirmKind(null);
          setPendingImport(null);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
