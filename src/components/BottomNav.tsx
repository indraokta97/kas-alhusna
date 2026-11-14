import { ArrowLeftRight, ChartColumn, Home, Settings } from "lucide-react";
import { useAuth } from "../lib/auth";
import type { Route } from "../lib/router";

const ITEMS = [
  { name: "home", href: "#/", label: "Ringkasan", icon: Home },
  { name: "transactions", href: "#/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { name: "report", href: "#/laporan", label: "Laporan", icon: ChartColumn },
  { name: "settings", href: "#/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

interface BottomNavProps {
  routeName: Extract<Route["name"], "home" | "transactions" | "report" | "settings">;
}

export function BottomNav({ routeName }: BottomNavProps) {
  const { isBendahara } = useAuth();
  const items = ITEMS.filter((item) => isBendahara || item.name !== "settings");

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <ul className={`grid ${isBendahara ? "grid-cols-4" : "grid-cols-3"}`}>
        {items.map(({ name, href, label, icon: Icon }) => {
          const active = routeName === name;
          return (
            <li key={name}>
              <a
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-2 text-[11px] transition-colors ${
                  active ? "font-semibold text-brand" : "font-medium text-muted hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-10 place-items-center rounded-lg transition-colors ${
                    active ? "bg-brand-soft" : ""
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
