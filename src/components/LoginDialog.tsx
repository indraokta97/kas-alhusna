import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { useDialogFocus } from "../lib/useDialogFocus";

type View = "login" | "setup" | "reset";

const COPY: Record<View, { title: string; description: string; submit: string }> = {
  login: {
    title: "Masuk sebagai bendahara",
    description: "Masukkan PIN untuk mencatat, mengubah, dan mengelola data kas.",
    submit: "Masuk",
  },
  setup: {
    title: "Buat PIN bendahara",
    description:
      "PIN ini membuka mode catat di perangkat ini. Buat 4–6 angka yang hanya diketahui bendahara.",
    submit: "Simpan PIN",
  },
  reset: {
    title: "Atur ulang PIN",
    description: "Buat PIN baru. Data kas tidak terhapus, hanya kuncinya yang diganti.",
    submit: "Ganti PIN",
  },
};

function PinField({
  id,
  label,
  value,
  onChange,
  inputRef,
  autoFocus,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[18px] font-semibold tracking-[0.35em] text-ink outline-none focus:border-brand"
      />
    </div>
  );
}

export function LoginDialog() {
  const {
    hasPin,
    authLoading,
    isLoginOpen,
    closeLogin,
    login,
    savePin,
  } = useAuth();
  const [view, setView] = useState<View>(hasPin ? "login" : "setup");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const pinRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(isLoginOpen, closeLogin, pinRef);

  useEffect(() => {
    if (!isLoginOpen) return;
    setView(hasPin ? "login" : "setup");
    setPin("");
    setConfirmation("");
    setError(null);
    setBusy(false);
    // Cukup saat dialog dibuka: perubahan hasPin setelah simpan PIN tidak boleh
    // mengubah tampilan di tengah proses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45">
        <div className="rounded-2xl bg-surface p-6 text-center shadow-xl">
          <p className="text-[13px] font-semibold text-ink">Memeriksa PIN…</p>
        </div>
      </div>
    );
  }

  const copy = COPY[view];
  const needsConfirmation = view !== "login";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (pin.length < 4) {
      setError("PIN minimal 4 angka.");
      return;
    }
    if (needsConfirmation && pin !== confirmation) {
      setError("Ulangi PIN belum sama.");
      return;
    }

    setBusy(true);
    try {
      if (view === "login") {
        const matches = await login(pin);
        if (!matches) {
          setError("PIN salah. Coba lagi.");
          return;
        }
      } else {
        await savePin(pin);
      }
      closeLogin();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/45">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeLogin();
        }}
      >
        <div ref={dialogRef} className="w-full max-w-[400px]">
          <img
            src="/ropik-2.webp"
            alt=""
            aria-hidden="true"
            width={478}
            height={508}
            className="mx-auto -mb-6 h-[clamp(84px,14dvh,120px)] w-auto object-contain"
          style={{ clipPath: "inset(0 0 12% 0)" }}
          />

          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onSubmit={handleSubmit}
            noValidate
            tabIndex={-1}
            className="w-full rounded-2xl bg-surface p-5 shadow-xl outline-none"
          >
            <h2 id={titleId} className="text-[17px] font-bold tracking-tight text-ink">
              {copy.title}
            </h2>
            <p id={descriptionId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {copy.description}
            </p>

            <div className="mt-4 space-y-3">
              <PinField
                id="bendahara-pin"
                label="PIN"
                value={pin}
                onChange={setPin}
                inputRef={pinRef}
                disabled={busy}
              />
              {needsConfirmation ? (
                <PinField
                  id="bendahara-pin-confirm"
                  label="Ulangi PIN"
                  value={confirmation}
                  onChange={setConfirmation}
                  disabled={busy}
                />
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-[12px] font-medium text-expense">
                {error}
              </p>
            ) : null}


            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={closeLogin}
                className="min-h-11 rounded-xl border border-line bg-surface text-[14px] font-semibold text-ink transition-colors hover:bg-canvas active:bg-line/60"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-11 rounded-xl bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-strong disabled:bg-line disabled:text-muted"
              >
                {busy ? "Memeriksa…" : copy.submit}
              </button>
            </div>


          </form>
        </div>
      </div>
    </div>
  );
}
