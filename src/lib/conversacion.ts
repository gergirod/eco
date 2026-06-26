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
};

type RadarRow = {
  tema: string;
  score?: number;
  menciones?: number;
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
};

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
      hint: "Apareció hace poco en el corpus — todavía poca historia para comparar.",
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
          label: "Ganando tracción",
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
      : `Promedio de ~${recentAvg} menciones por día en la última semana del corpus.`,
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
    group.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const lead = group[0];
    const allHighlights = dedupeHighlights(group.flatMap((x) => x.highlights ?? []), 999);
    const combined: RadarRow = {
      ...lead,
      tema: lead.tema,
      score: group.reduce((s, x) => s + (x.score ?? 0), 0),
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

export function buildConversacionRanking(
  radar: RadarRow[],
  options: { crossOnly?: boolean; limit?: number; mergeClusters?: boolean } = {}
): ConversacionTopic[] {
  const { crossOnly = true, limit = 25, mergeClusters = true } = options;
  let rows = radar.filter((r) => r.tema && !r.tema.startsWith("_"));
  if (crossOnly) {
    rows = rows.filter((r) => r.cross_comunidad);
  }
  if (mergeClusters) {
    rows = mergeClusterRows(rows);
  }
  rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const maxScore = rows[0]?.score ?? 1;

  return rows.slice(0, limit).map((r, i) => {
    const base = rowToTopic(r, Boolean(r.cluster && MERGE_CLUSTERS.has(r.cluster)));
    return {
      ...base,
      rank: i + 1,
      scorePct: Math.round(((base.score ?? 0) / maxScore) * 100),
    };
  });
}

export function conversacionSubline(
  topics: ConversacionTopic[],
  crossOnly: boolean,
  meta: MetaShape
): string {
  const ch = meta.discovery?.channels_covered ?? 0;
  const mode = crossOnly ? "temas en 2+ canales" : "temas detectados";
  if (!topics.length) {
    return `Sin ${mode} en el corpus actual (${ch} canales monitoreados).`;
  }
  const cross = topics.filter((t) => t.crossComunidad).length;
  return `${topics.length} ${mode} · ${cross} cross-comunidad en esta vista · transcript de programas capturados`;
}

export const CHANNEL_SLUG: Record<string, string> = {
  OLGA: "olga",
  "LUZU TV": "luzu",
  BLENDER: "blend",
  BONDI: "bondi",
  GELATINA: "gelatina",
  URBANA: "urbana",
};
