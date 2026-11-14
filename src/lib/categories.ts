import {
  CalendarDays,
  Car,
  HandCoins,
  Handshake,
  Landmark,
  MoreHorizontal,
  Package,
  Receipt,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { TxType } from "./types";

export interface CategoryDef {
  name: string;
  icon: LucideIcon;
}

/**
 * Ikon dipilih karena maknanya, bukan karena gaya pustaka:
 * Users = iuran anggota, HandCoins = infaq, Handshake = sponsor,
 * Landmark = dana lembaga, Utensils = konsumsi, Package = perlengkapan,
 * Receipt = biaya operasional, CalendarDays = acara, Car = transport,
 * MoreHorizontal = tanpa kategori khusus.
 */
export const CATEGORIES: Record<TxType, CategoryDef[]> = {
  in: [
    { name: "Iuran Anggota", icon: Users },
    { name: "Infaq & Donasi", icon: HandCoins },
    { name: "Sponsorship", icon: Handshake },
    { name: "Dana Kegiatan", icon: Landmark },
    { name: "Lainnya", icon: MoreHorizontal },
  ],
  out: [
    { name: "Konsumsi", icon: Utensils },
    { name: "Perlengkapan", icon: Package },
    { name: "Operasional", icon: Receipt },
    { name: "Kegiatan & Acara", icon: CalendarDays },
    { name: "Transport", icon: Car },
    { name: "Lainnya", icon: MoreHorizontal },
  ],
};

const ALL_CATEGORIES = [...CATEGORIES.in, ...CATEGORIES.out];

export function categoryIcon(name: string): LucideIcon {
  return ALL_CATEGORIES.find((category) => category.name === name)?.icon ?? MoreHorizontal;
}
