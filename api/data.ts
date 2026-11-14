import type { VercelRequest, VercelResponse } from "@vercel/node";

const KEY = "kas-alhusna:data";

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { result?: string | null };
  const result = data.result ?? null;
  if (typeof result === "string" && result.startsWith('"') && result.endsWith('"')) {
    try {
      return JSON.parse(result) as string;
    } catch {
      return result.slice(1, -1);
    }
  }
  return result;
}

async function kvSet(key: string, value: string): Promise<boolean> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const response = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.ok;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const backend = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (req.method === "GET") {
    if (!backend) return res.status(503).json({ backend: false, data: null });
    try {
      const raw = await kvGet(KEY);
      if (!raw) return res.status(200).json({ backend: true, data: null });
      return res.status(200).json({ backend: true, data: JSON.parse(raw) });
    } catch {
      return res.status(503).json({ backend: false, data: null });
    }
  }

  if (req.method === "POST") {
    if (!backend) return res.status(503).json({ backend: false, ok: false });
    try {
      const ok = await kvSet(KEY, JSON.stringify(req.body ?? {}));
      if (!ok) return res.status(503).json({ backend: false, ok: false });
      return res.status(200).json({ backend: true, ok: true });
    } catch {
      return res.status(503).json({ backend: false, ok: false });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
