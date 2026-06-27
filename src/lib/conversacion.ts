/**
 * Conversación — ranking de temas en streaming (SPEC-008: no es Tendencias ni Novedades).
 * Fuente: radar.json (pipeline/radar.py sobre topics/) + highlights en export_ui.
 */

export type ConversacionHighlight = {
  channel: string;
  video_id: string;
  title: string;
  subtema: string;
  contexto: string;
};

export type ConversacionMomentum = "sube" | "baja" | "estable" | "nuevo";

export type MomentumInfo = {
  kind: ConversacionMomentum;
  label: string;
  hint: string;
};

export type ConversacionTopic = {
  rank: number;
  tema: string;
  temaLabel: string;
  score: number;
  trendScore: number;
  growthWow: number;
  scorePct: number;
  menciones: number;
  canales: string[];
  crossComunidad: boolean;
  multiDia: boolean;
  momentum: ConversacionMomentum;
  momentumLabel: string;
  momentumHint: string;
  serie: { date: string; n: number }[];
  categoria: string | null;
  cluster: string | null;
  variantesRelacionadas: string[];
  highlights: ConversacionHighlight[];
  highlightsTotal: number;
  mergedCluster: boolean;
  gtStatus?: string | null;
  gtLeadDays?: number | null;
};

type RadarRow = {
  tema: string;
  score?: number;
  trend_score?: number;
  menciones?: number;
  growth_wow?: number;
  demand_ratio?: number;
  canales?: string[];
  categorias?: string[];
  cross_comunidad?: boolean;
  multi_dia?: boolean;
  candidato?: boolean;
  serie?: { date: string; n: number }[];
  cluster?: string | null;
  variantes_relacionadas?: string[];
  highlights?: ConversacionHighlight[];
  highlights_total?: number;
  gt_status?: string | null;
  gt_lead_days?: number | null;
};

function rankScore(r: RadarRow): number {
  return r.trend_score ?? r.score ?? 0;
}

/** Clusters que se fusionan en el ranking (variantes del mismo eje). */
const MERGE_CLUSTERS = new Set(["mundial", "series"]);

function titleLabel(tema: string): string {
  return tema
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function clusterLabel(cluster: string): string {
  if (cluster === "mundial") return "Mundial";
  if (cluster === "series") return "Series y TV";
  return titleLabel(cluster);
}

function parseSerieDate(d: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim());
  if (!m) return 0;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function computeMomentum(serie: { date: string; n: number }[]): MomentumInfo {
  if (serie.length < 2) {
    return {
      kind: "nuevo",
      label: "Tema reciente",
      hint: "Apareció hace poco en el período — todavía poca historia para comparar.",
    };
  }
  const sorted = [...serie].sort((a, b) => parseSerieDate(a.date) - parseSerieDate(b.date));
  const recent = sorted.slice(-3);
  const prev = sorted.slice(-6, -3);
  const recentSum = recent.reduce((s, p) => s + p.n, 0);
  const prevSum = prev.reduce((s, p) => s + p.n, 0);
  const recentAvg = Math.round(recentSum / Math.max(1, recent.length));
  const prevAvg = prev.length ? Math.round(prevSum / prev.length) : null;

  if (prevSum === 0) {
    return recentSum > 0
      ? {
          kind: "sube",
          label: "Empieza a pegar fuerte",
          hint: `~${recentAvg} menciones por día en los últimos ${recent.length} días con data.`,
        }
      : {
          kind: "nuevo",
          label: "Tema reciente",
          hint: "Sin menciones previas en el período para comparar.",
        };
  }

  const ratio = recentSum / prevSum;
  if (ratio >= 1.25) {
    const pct = Math.round((ratio - 1) * 100);
    return {
      kind: "sube",
      label: `Más charla reciente (+${pct}%)`,
      hint: `~${recentAvg}/día últimos días vs ~${prevAvg}/día en el tramo anterior.`,
    };
  }
  if (ratio <= 0.75) {
    const pct = Math.round((1 - ratio) * 100);
    return {
      kind: "baja",
      label: `Menos charla reciente (−${pct}%)`,
      hint: `~${recentAvg}/día últimos días vs ~${prevAvg}/día en el tramo anterior.`,
    };
  }

  return {
    kind: "estable",
    label: `Ritmo parecido (~${recentAvg}/día)`,
    hint: prevAvg
      ? `Se habla con intensidad similar al tramo anterior (~${prevAvg}/día) — no es pico ni despegue.`
      : `Promedio de ~${recentAvg} menciones por día en la última semana del período.`,
  };
}

function rowToTopic(r: RadarRow, mergedCluster = false): Omit<ConversacionTopic, "rank" | "scorePct"> {
  const serie = r.serie ?? [];
  const cats = r.categorias ?? [];
  const cluster = r.cluster ?? null;
  const label =
    mergedCluster && cluster ? clusterLabel(cluster) : titleLabel(r.tema);
  const mom = computeMomentum(serie);
  return {
    tema: r.tema,
    temaLabel: label,
    score: r.score ?? 0,
    trendScore: rankScore(r),
    growthWow: r.growth_wow ?? 0,
    menciones: r.menciones ?? 0,
    canales: r.canales ?? [],
    crossComunidad: Boolean(r.cross_comunidad),
    multiDia: Boolean(r.multi_dia),
    momentum: mom.kind,
    momentumLabel: mom.label,
    momentumHint: mom.hint,
    serie,
    categoria: cats[0] ?? null,
    cluster,
    variantesRelacionadas: r.variantes_relacionadas ?? [],
    highlights: r.highlights ?? [],
    highlightsTotal: r.highlights_total ?? r.highlights?.length ?? 0,
    mergedCluster,
    gtStatus: r.gt_status ?? null,
    gtLeadDays: r.gt_lead_days ?? null,
  };
}

function dedupeHighlights(items: ConversacionHighlight[], limit = 20): ConversacionHighlight[] {
  const seen = new Set<string>();
  const out: ConversacionHighlight[] = [];
  for (const h of items) {
    const key = h.contexto.slice(0, 72).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

function mergeClusterRows(rows: RadarRow[]): RadarRow[] {
  const byCluster = new Map<string, RadarRow[]>();
  const rest: RadarRow[] = [];
  for (const r of rows) {
    const ck = r.cluster;
    if (ck && MERGE_CLUSTERS.has(ck)) {
      const list = byCluster.get(ck) || [];
      list.push(r);
      byCluster.set(ck, list);
    } else {
      rest.push(r);
    }
  }
  const merged: RadarRow[] = [...rest];
  for (const [ck, group] of byCluster) {
    group.sort((a, b) => rankScore(b) - rankScore(a));
    const lead = group[0];
    const allHighlights = dedupeHighlights(group.flatMap((x) => x.highlights ?? []), 999);
    const combined: RadarRow = {
      ...lead,
      tema: lead.tema,
      score: group.reduce((s, x) => s + (x.score ?? 0), 0),
      trend_score: group.reduce((s, x) => s + rankScore(x), 0),
      menciones: group.reduce((s, x) => s + (x.menciones ?? 0), 0),
      canales: [...new Set(group.flatMap((x) => x.canales ?? []))],
      cross_comunidad: group.some((x) => x.cross_comunidad),
      multi_dia: group.some((x) => x.multi_dia),
      variantes_relacionadas: [
        ...new Set(
          group.flatMap((x) => [x.tema, ...(x.variantes_relacionadas ?? [])]).filter(Boolean)
        ),
      ].filter((t) => t !== lead.tema),
      highlights: allHighlights.slice(0, 20),
      highlights_total: allHighlights.length,
      cluster: ck,
    };
    merged.push(combined);
  }
  return merged;
}

type MetaShape = {
  exported_at?: string;
  n_trends?: number;
  discovery?: { channels_covered?: number; last_capture?: string };
};

export type ConversacionSort =
  | "relevancia"
  | "menciones"
  | "canales"
  | "crecimiento"
  | "az";

export function getConversacionCategories(topics: ConversacionTopic[]): string[] {
  const cats = new Set<string>();
  for (const t of topics) {
    if (t.categoria) cats.add(t.categoria);
  }
  return [...cats].sort((a, b) => a.localeCompare(b, "es"));
}

export function filterConversacionTopics(
  topics: ConversacionTopic[],
  filters: {
    search?: string;
    categoria?: string;
    momentum?: ConversacionMomentum | "";
  } = {}
): ConversacionTopic[] {
  const needle = filters.search?.trim().toLowerCase() ?? "";
  return topics.filter((t) => {
    if (filters.categoria && t.categoria !== filters.categoria) return false;
    if (filters.momentum && t.momentum !== filters.momentum) return false;
    if (!needle) return true;
    const hay =
      t.tema.toLowerCase().includes(needle) ||
      t.temaLabel.toLowerCase().includes(needle) ||
      (t.categoria?.toLowerCase().includes(needle) ?? false) ||
      t.canales.some((c) => c.toLowerCase().includes(needle)) ||
      t.variantesRelacionadas.some((v) => v.toLowerCase().includes(needle));
    return hay;
  });
}

function sortMetric(t: ConversacionTopic, sort: ConversacionSort): number {
  switch (sort) {
    case "menciones":
      return t.menciones;
    case "canales":
      return t.canales.length;
    case "crecimiento":
      return t.growthWow;
    default:
      return t.trendScore;
  }
}

export function sortConversacionTopics(
  topics: ConversacionTopic[],
  sort: ConversacionSort
): ConversacionTopic[] {
  const sorted = [...topics];
  if (sort === "az") {
    sorted.sort((a, b) => a.temaLabel.localeCompare(b.temaLabel, "es"));
  } else {
    sorted.sort((a, b) => sortMetric(b, sort) - sortMetric(a, sort));
  }
  const maxMetric = sortMetric(sorted[0] ?? { trendScore: 1 } as ConversacionTopic, sort) || 1;
  return sorted.map((t, i) => ({
    ...t,
    rank: i + 1,
    scorePct:
      sort === "az"
        ? t.scorePct
        : Math.round((sortMetric(t, sort) / maxMetric) * 100),
  }));
}

export function buildConversacionRanking(
  radar: RadarRow[],
  options: { crossOnly?: boolean; limit?: number; mergeClusters?: boolean } = {}
): ConversacionTopic[] {
  const { crossOnly = true, limit, mergeClusters = true } = options;
  let rows = radar.filter((r) => r.tema && !r.tema.startsWith("_"));
  if (crossOnly) {
    rows = rows.filter(
      (r) => r.cross_comunidad && (Boolean(r.candidato) || rankScore(r) >= 12)
    );
  }
  if (mergeClusters) {
    rows = mergeClusterRows(rows);
  }
  rows.sort((a, b) => rankScore(b) - rankScore(a));
  const maxScore = rankScore(rows[0] ?? {}) || 1;
  const capped = limit && limit > 0 ? rows.slice(0, limit) : rows;

  return capped.map((r, i) => {
    const base = rowToTopic(r, Boolean(r.cluster && MERGE_CLUSTERS.has(r.cluster)));
    const rs = rankScore(r);
    return {
      ...base,
      rank: i + 1,
      scorePct: Math.round((rs / maxScore) * 100),
    };
  });
}

export function conversacionSubline(
  topics: ConversacionTopic[],
  crossOnly: boolean,
  meta: MetaShape,
  options?: { totalAvailable?: number; showing?: number }
): string {
  const ch = meta.discovery?.channels_covered ?? 0;
  const mode = crossOnly ? "temas en 2+ canales" : "temas detectados";
  const total = options?.totalAvailable ?? topics.length;
  const showing = options?.showing ?? topics.length;
  if (!total) {
    return `Todavía no hay ${mode} en lo que medimos hoy (${ch} canales).`;
  }
  const cross = topics.filter((t) => t.crossComunidad).length;
  const countLine =
    showing < total
      ? `Mostrando ${showing} de ${total} ${mode}`
      : `${total} ${mode}`;
  return `${countLine} · ${cross} en 2+ canales en esta vista · emisiones que medimos`;
}

export const CHANNEL_SLUG: Record<string, string> = {
  OLGA: "olga",
  "LUZU TV": "luzu",
  BLENDER: "blend",
  BONDI: "bondi",
  GELATINA: "gelatina",
  URBANA: "urbana",
};
