import { NextResponse } from "next/server";
import channels from "@/data/channels.json";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Chequeo real on-demand: pide la página /live del canal y detecta señales de
// transmisión en vivo en el HTML. YouTube puede limitar requests desde datacenter;
// ante error/timeout se devuelve "desconocido" en vez de romper la UI.
async function checkLive(url: string): Promise<{ live: boolean | null; title?: string }> {
  const liveUrl = url.replace(/\/$/, "") + "/live";
  try {
    const res = await fetch(liveUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { live: null };
    const html = await res.text();
    // Señales de vivo: hlsManifestUrl / isLiveNow:true / "watching now"
    const live =
      /"isLiveNow":true/.test(html) ||
      /hlsManifestUrl/.test(html) ||
      /"isLive":true/.test(html);
    let title: string | undefined;
    const m = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (m) title = m[1];
    return { live, title };
  } catch {
    return { live: null };
  }
}

export async function GET() {
  const targets = (channels as any[]).filter((c) => c.enabled || c.has_data);
  const results = await Promise.all(
    targets.map(async (c) => {
      const r = await checkLive(c.url);
      return { id: c.id, name: c.name, live: r.live, title: r.title };
    })
  );
  return NextResponse.json({ checked_at: new Date().toISOString(), channels: results });
}
