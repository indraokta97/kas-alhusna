import { useEffect, useState } from "react";
import type { TxType } from "./types";

export type Route =
  | { name: "home" }
  | { name: "transactions" }
  | { name: "report" }
  | { name: "settings" }
  | { name: "form"; transactionId?: string; presetType?: TxType };

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, "");
  const [rawPath, rawQuery] = clean.split("?");
  const path = rawPath || "/";
  const params = new URLSearchParams(rawQuery ?? "");

  if (path === "/" || path === "") return { name: "home" };
  if (path === "/transaksi") return { name: "transactions" };
  if (path === "/laporan") return { name: "report" };
  if (path === "/pengaturan") return { name: "settings" };

  if (path === "/catat") {
    const jenis = params.get("jenis");
    const presetType = jenis === "in" || jenis === "out" ? (jenis as TxType) : undefined;
    return { name: "form", presetType };
  }

  if (path.startsWith("/ubah/")) {
    const id = decodeURIComponent(path.slice("/ubah/".length));
    if (id) return { name: "form", transactionId: id };
  }

  return { name: "home" };
}

export function routeKey(route: Route): string {
  return route.name === "form" ? `form:${route.transactionId ?? "new"}` : route.name;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

export function navigate(path: string): void {
  if (window.location.hash === `#${path}`) return;
  window.location.hash = path;
}

export function goBack(fallback: string): void {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}
