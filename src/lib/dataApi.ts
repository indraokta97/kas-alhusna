import type { AppData } from "./types";

export async function apiLoadData(): Promise<{ backend: boolean; data: AppData | null }> {
  try {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (!response.ok) return { backend: false, data: null };
    const result = (await response.json()) as { backend?: boolean; data?: AppData | null };
    return { backend: Boolean(result.backend), data: result.data ?? null };
  } catch {
    return { backend: false, data: null };
  }
}

export async function apiSaveData(data: AppData): Promise<boolean> {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { ok?: boolean; backend?: boolean };
    return Boolean(result.ok && result.backend);
  } catch {
    return false;
  }
}
