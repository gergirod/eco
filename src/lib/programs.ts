/** Índice de programas con PNT, armado desde reports.json + moments.json. */

export type PntRow = {
  brand_slug: string;
  brand_name: string;
  channel: string;
  channel_name: string;
  date: string;
  date_iso: string;
  video_id: string;
  title: string;
  minute: string;
  t_seconds: number;
  views: number;
  value_usd: number;
  quote: string;
  tier: number;
  tier_label?: string;
  sentiment: string;
  conc_at: number | null;
  program_peak?: number;
  precise?: boolean;
};

export type Program = {
  video_id: string;
  channel: string;
  channel_name: string;
  title: string;
  date: string;
  date_iso: string;
  views: number;
  peak?: number;
  avg?: number;
  dur_min?: number;
  pnt: PntRow[];
  pnt_count: number;
  brands: string[];
};

export function buildProgramsIndex(
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>,
  moments: Record<string, Record<string, unknown>>
): Program[] {
  const byVid = new Map<string, Program>();

  for (const [slug, r] of Object.entries(reports)) {
    for (const m of r.detail || []) {
      const vid = String(m.video_id || "");
      if (!vid) continue;
      let p = byVid.get(vid);
      if (!p) {
        const mo = moments[vid] || {};
        p = {
          video_id: vid,
          channel: String(m.channel || ""),
          channel_name: String(m.channel_name || ""),
          title: String(m.title || mo.title || ""),
          date: String(m.date || ""),
          date_iso: String(m.date_iso || ""),
          views: Number(m.views || 0),
          peak: mo.peak != null ? Number(mo.peak) : undefined,
          avg: mo.avg != null ? Number(mo.avg) : undefined,
          dur_min: mo.dur_min != null ? Number(mo.dur_min) : undefined,
          pnt: [],
          pnt_count: 0,
          brands: [],
        };
        byVid.set(vid, p);
      }
      p.pnt.push({ ...(m as Omit<PntRow, "brand_slug" | "brand_name">), brand_slug: slug, brand_name: r.name });
    }
  }

  for (const p of byVid.values()) {
    p.pnt_count = p.pnt.length;
    p.brands = [...new Set(p.pnt.map((x) => x.brand_slug))];
    p.pnt.sort((a, b) => (a.t_seconds || 0) - (b.t_seconds || 0));
  }

  return Array.from(byVid.values()).sort(
    (a, b) =>
      (b.date_iso || "").localeCompare(a.date_iso || "") ||
      (b.peak || 0) - (a.peak || 0) ||
      b.pnt_count - a.pnt_count
  );
}
