import type { VercelRequest, VercelResponse } from "@vercel/node";

const KEY = "kas-alhusna:pin-hash";

async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`kas-alhusna:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { result?: string | null };
  return data.result ?? null;
}

async function kvSet(key: string, value: string): Promise<boolean> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const response = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
  return response.ok;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const stored = await kvGet(KEY);
      return res.status(200).json({ hasPin: Boolean(stored), backend: Boolean(process.env.KV_REST_API_URL) });
    } catch {
      return res.status(503).json({ hasPin: false, backend: false });
    }
  }

  if (req.method === "POST") {
    const { action, pin } = (req.body ?? {}) as { action?: string; pin?: string };
    if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: "PIN harus 4-6 angka." });
    }

    try {
      if (action === "set") {
        const hash = await hashPin(pin);
        const ok = await kvSet(KEY, hash);
        if (!ok) return res.status(503).json({ error: "Penyimpanan bersama belum tersedia." });
        return res.status(200).json({ ok: true });
      }
      if (action === "verify") {
        const stored = await kvGet(KEY);
        if (!stored) return res.status(200).json({ ok: false });
        const hash = await hashPin(pin);
        return res.status(200).json({ ok: hash === stored });
      }
      return res.status(400).json({ error: "Aksi tidak dikenal." });
    } catch {
      return res.status(503).json({ error: "Penyimpanan bersama tidak tersedia." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
