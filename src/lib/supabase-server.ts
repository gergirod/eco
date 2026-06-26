/** Supabase server-side (service role) — solo API routes, nunca al cliente. */

export function supabaseServiceConfig(): {
  url: string;
  key: string;
  enabled: boolean;
} {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    "";
  return { url, key, enabled: Boolean(url && key) };
}

export async function supabaseRest<T>(
  path: string,
  init?: RequestInit & { prefer?: string }
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { url, key, enabled } = supabaseServiceConfig();
  if (!enabled) return { ok: false, status: 503, data: null };

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (init?.prefer) headers.Prefer = init.prefer;

  try {
    const res = await fetch(`${url}/rest/v1${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const text = await res.text();
    if (!text) return { ok: true, status: res.status, data: null };
    return { ok: true, status: res.status, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 500, data: null };
  }
}
