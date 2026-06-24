// Lectura de datasets desde Supabase (tabla ui_data). Isomórfico (server + client).
// Si no hay env configurado o falla, devuelve null y el caller usa el JSON del bundle.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(URL && ANON);

export async function fetchDataset<T>(key: string): Promise<T | null> {
  if (!URL || !ANON) return null;
  try {
    const res = await fetch(
      `${URL}/rest/v1/ui_data?key=eq.${encodeURIComponent(key)}&select=payload`,
      {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return (rows?.[0]?.payload as T) ?? null;
  } catch {
    return null;
  }
}
