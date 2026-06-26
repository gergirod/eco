/**
 * Conversación — ranking de temas en streaming (SPEC-008: no es Tendencias ni Novedades).
 * Fuente: radar.json (pipeline/radar.py sobre topics/).
 */

export type ConversacionMomentum = "sube" | "baja" | "estable" | "nuevo";

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
  serie: { date: string; n: number }[];
  categoria: string | null;
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
};

type MetaShape = {
  exported_at?: string;
  n_trends?: number;
  discovery?: { channels_covered?: number; last_capture?: string };
};

function titleLabel(tema: string): string {
  return tema
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseSerieDate(d: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim());
  if (!m) return 0;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function computeMomentum(serie: { date: string; n: number }[]): ConversacionMomentum {
  if (serie.length < 2) return "nuevo";
  const sorted = [...serie].sort((a, b) => parseSerieDate(a.date) - parseSerieDate(b.date));
  const recent = sorted.slice(-3).reduce((s, p) => s + p.n, 0);
  const prev = sorted.slice(-6, -3).reduce((s, p) => s + p.n, 0);
  if (prev === 0) return recent > 0 ? "sube" : "nuevo";
  const ratio = recent / prev;
  if (ratio >= 1.25) return "sube";
  if (ratio <= 0.75) return "baja";
  return "estable";
}

export function buildConversacionRanking(
  radar: RadarRow[],
  options: { crossOnly?: boolean; limit?: number } = {}
): ConversacionTopic[] {
  const { crossOnly = true, limit = 25 } = options;
  let rows = radar.filter((r) => r.tema && !r.tema.startsWith("_"));
  if (crossOnly) {
    rows = rows.filter((r) => r.cross_comunidad);
  }
  rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const maxScore = rows[0]?.score ?? 1;

  return rows.slice(0, limit).map((r, i) => {
    const serie = r.serie ?? [];
    const cats = r.categorias ?? [];
    return {
      rank: i + 1,
      tema: r.tema,
      temaLabel: titleLabel(r.tema),
      score: r.score ?? 0,
      scorePct: Math.round(((r.score ?? 0) / maxScore) * 100),
      menciones: r.menciones ?? 0,
      canales: r.canales ?? [],
      crossComunidad: Boolean(r.cross_comunidad),
      multiDia: Boolean(r.multi_dia),
      momentum: computeMomentum(serie),
      serie,
      categoria: cats[0] ?? null,
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
