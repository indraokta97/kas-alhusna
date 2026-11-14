/** Klien untuk PIN bersama (backend). Kembali null bila backend tidak tersedia. */

export async function apiHasPin(): Promise<boolean | null> {
  try {
    const response = await fetch("/api/pin", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { hasPin?: boolean; backend?: boolean };
    if (!data.backend) return null;
    return Boolean(data.hasPin);
  } catch {
    return null;
  }
}

export async function apiVerifyPin(pin: string): Promise<boolean | null> {
  try {
    const response = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pin }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return null;
  }
}

export async function apiSetPin(pin: string): Promise<boolean | null> {
  try {
    const response = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", pin }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return null;
  }
}
