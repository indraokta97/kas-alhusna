import { Lock, Plus } from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { LoginDialog } from "./components/LoginDialog";
import { SplashScreen } from "./components/SplashScreen";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./lib/auth";
import { routeKey, useRoute } from "./lib/router";
import { StoreProvider, useStore } from "./lib/store";
import { Dashboard } from "./pages/Dashboard";
import { ReportPage } from "./pages/Report";
import { SettingsPage } from "./pages/Settings";
import { TransactionFormPage } from "./pages/TransactionForm";
import { TransactionsPage } from "./pages/Transactions";

function Fab() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)_+_16px)]">
      <div className="flex justify-center">
        <a
          href="#/catat"
          aria-label="Catat transaksi"
          className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_14px_28px_-10px_rgba(11,95,165,0.6)] transition-transform active:scale-[0.97]"
        >
          <Plus size={24} strokeWidth={2.6} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function LockedForm() {
  const { openLogin } = useAuth();

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)_+_16px)]">
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center">
        <img
          src="/ropik-2.webp"
          alt=""
          aria-hidden="true"
          width={478}
          height={508}
          className="mx-auto h-[120px] w-auto object-contain"
          style={{ clipPath: "inset(0 0 12% 0)" }}
        />
        <h1 className="mt-1 text-[18px] font-bold tracking-tight text-ink">Khusus bendahara</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Halaman catat hanya bisa dibuka setelah masuk dengan PIN bendahara. Data kas tetap
          bisa dilihat tanpa masuk.
        </p>
        <button
          type="button"
          onClick={openLogin}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          <Lock size={15} aria-hidden="true" />
          Masuk sebagai bendahara
        </button>
        <a
          href="#/"
          className="mt-1 flex min-h-11 items-center justify-center text-[13px] font-semibold text-brand"
        >
          Kembali ke ringkasan
        </a>
      </div>
    </div>
  );
}

function Shell() {
  const route = useRoute();
  const { saveFailed } = useStore();
  const { isBendahara } = useAuth();
  const isForm = route.name === "form";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-canvas sm:border-x sm:border-line">
      {saveFailed ? (
        <p
          role="alert"
          className="bg-expense-soft px-4 py-2 text-center text-[11px] font-medium leading-snug text-expense"
        >
          Data gagal disimpan di browser ini. Ekspor data sebelum menutup aplikasi.
        </p>
      ) : null}

      <main
        key={routeKey(route)}
        className={`route-enter flex-1 ${
          isForm ? "" : "pb-[calc(env(safe-area-inset-bottom)_+_76px)]"
        }`}
      >
        {route.name === "home" ? <Dashboard /> : null}
        {route.name === "transactions" ? <TransactionsPage /> : null}
        {route.name === "report" ? <ReportPage /> : null}
        {route.name === "settings" ? <SettingsPage /> : null}
        {route.name === "form" ? (
          isBendahara ? (
            <TransactionFormPage
              transactionId={route.transactionId}
              presetType={route.presetType}
            />
          ) : (
            <LockedForm />
          )
        ) : null}
      </main>

      {route.name !== "form" ? <BottomNav routeName={route.name} /> : null}
      {isBendahara && (route.name === "home" || route.name === "transactions") ? <Fab /> : null}
      <LoginDialog />
      <SplashScreen />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </AuthProvider>
    </StoreProvider>
  );
}
