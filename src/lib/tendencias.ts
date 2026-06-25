/**
 * Tendencias — patrones de mercado desde export JSON (SPEC-008 §8, ARCH-001).
 * Insights compuestos; nunca perfiles de tema ni Google Trends como producto.
 */

import { parseDisplayDate } from "./novedades";

export type TendenciaConfidence = "evidencia" | "conversacion" | "insight";

export type TendenciaAction = {
  href: string;
  label: string;
};

export type TendenciaInsight = {
  id: string;
  pattern: string;
  period: string;
  confidence: TendenciaConfidence;
  coverage: string;
  implication: string;
  signals: string[];
  action: TendenciaAction;
};

type RadarRow = {
  tema: string;
  score?: number;
  menciones?: number;
  canales?: string[];
  cross_comunidad?: boolean;
  multi_dia?: boolean;
  candidato?: boolean;
  serie?: { date: string; n: number }[];
  gt_status?: string | null;
  gt_lead_days?: number | null;
};

type BenchmarkRow = {
  id: string;
  name: string;
  brands?: number;
  mentions?: number;
  share_views?: number;
  avg_concurrent?: number;
  vod_views?: number;
};

type AudienceRow = {
  id: string;
  name: string;
  avg_concurrent?: number;
  peak_concurrent?: number;
};

type MetaDiscovery = {
  exported_at?: string;
  discovery?: {
    channels_covered?: number;
    last_capture?: string;
  };
};

const CHANNEL_SLUG: Record<string, string> = {
  OLGA: "olga",
  "LUZU TV": "luzu",
  BLENDER: "blend",
};

const CONFIDENCE_ORDER: Record<TendenciaConfidence, number> = {
  insight: 0,
  evidencia: 1,
  conversacion: 2,
};

function formatChannelList(canales: string[]): string {
  if (canales.length === 1) return canales[0];
  if (canales.length === 2) return `${canales[0]} y ${canales[1]}`;
  return `${canales.slice(0, -1).join(", ")} y ${canales[canales.length - 1]}`;
}

function serieMomentum(serie: { date: string; n: number }[]): "up" | "down" | "flat" | null {
  if (!serie || serie.length < 2) return null;
  const sorted = [...serie].sort(
    (a, b) => parseDisplayDate(a.date) - parseDisplayDate(b.date)
  );
  const mid = Math.max(1, Math.floor(sorted.length / 2));
  const first = sorted.slice(0, mid).reduce((s, p) => s + p.n, 0);
  const second = sorted.slice(mid).reduce((s, p) => s + p.n, 0);
  if (second > first * 1.12) return "up";
  if (second < first * 0.88) return "down";
  return "flat";
}

function periodLabel(meta: MetaDiscovery): string {
  const last = meta.discovery?.last_capture;
  if (last) return `Período capturado hasta ${last}`;
  if (meta.exported_at) {
    const d = new Date(meta.exported_at).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `Corpus al ${d}`;
  }
  return "Período actual del export";
}

function coverageFooter(meta: MetaDiscovery): string {
  const n = meta.discovery?.channels_covered ?? 3;
  return `Basado en ${n} canales con captura · corpus corto — patrón exploratorio, no forecasting`;
}

function buildCommercialInsights(
  benchmark: BenchmarkRow[],
  meta: MetaDiscovery,
  period: string,
  coverage: string
): TendenciaInsight[] {
  const insights: TendenciaInsight[] = [];
  if (benchmark.length < 2) return insights;

  const byShare = [...benchmark].sort((a, b) => (b.share_views || 0) - (a.share_views || 0));
  const byBrands = [...benchmark].sort((a, b) => (b.brands || 0) - (a.brands || 0));
  const leaderShare = byShare[0];
  const leaderBrands = byBrands[0];

  if (leaderShare && (leaderShare.share_views || 0) >= 40) {
    const runner = byShare[1];
    insights.push({
      id: "commercial-share-views",
      pattern: `${leaderShare.name} concentra el ${leaderShare.share_views}% de las reproducciones capturadas`,
      period,
      confidence: "evidencia",
      coverage,
      implication:
        runner && runner.share_views
          ? `Para alcance en VOD del período, ${leaderShare.name} domina frente a ${runner.name} (${runner.share_views}%). Evaluá mix de canales según objetivo de awareness.`
          : "El inventario con mayor volumen de views en el período está muy concentrado — el mix de canales importa para alcance.",
      signals: [
        `Share views: ${benchmark.map((b) => `${b.name} ${b.share_views ?? 0}%`).join(" · ")}`,
        "Fuente: benchmark del export",
      ],
      action: {
        href: `/canales/${leaderShare.id}?tab=comparaciones`,
        label: "Comparar canales",
      },
    });
  }

  if (
    leaderBrands &&
    leaderShare &&
    leaderBrands.id !== leaderShare.id &&
    (leaderBrands.brands || 0) > 0
  ) {
    insights.push({
      id: "commercial-brands-vs-views",
      pattern: `La actividad comercial no sigue al volumen de views: ${leaderBrands.name} lidera marcas activas, ${leaderShare.name} lidera reproducciones`,
      period,
      confidence: "insight",
      coverage,
      implication:
        "Un canal puede ser fuerte en audiencia y otro en densidad de pauta — útil para separar objetivos de reach vs. social proof comercial.",
      signals: [
        `Marcas activas: ${benchmark.map((b) => `${b.name} ${b.brands ?? 0}`).join(" · ")}`,
        `Menciones PNT: ${benchmark.map((b) => `${b.name} ${b.mentions ?? 0}`).join(" · ")}`,
      ],
      action: {
        href: `/canales/${leaderBrands.id}?tab=marcas`,
        label: "Ver marcas activas",
      },
    });
  }

  return insights;
}

function buildAudienceInsights(
  audience: AudienceRow[],
  benchmark: BenchmarkRow[],
  meta: MetaDiscovery,
  period: string,
  coverage: string
): TendenciaInsight[] {
  if (audience.length < 2) return [];

  const sorted = [...audience].sort(
    (a, b) => (b.avg_concurrent || 0) - (a.avg_concurrent || 0)
  );
  const top = sorted[0];
  const second = sorted[1];
  if (!top?.avg_concurrent || !second?.avg_concurrent) return [];

  const ratio = top.avg_concurrent / second.avg_concurrent;
  if (ratio < 1.4) return [];

  return [
    {
      id: "audience-gap",
      pattern: `Brecha de audiencia en vivo: ${top.name} promedia ${Math.round(ratio)}× los concurrentes de ${second.name}`,
      period,
      confidence: "insight",
      coverage,
      implication:
        "Para momentos de máximo impacto en vivo, la elección de canal no es equivalente — negociá con datos de concurrentes al minuto.",
      signals: [
        `Promedio concurrentes: ${audience.map((a) => `${a.name} ${a.avg_concurrent ?? "—"}`).join(" · ")}`,
        `Picos: ${audience.map((a) => `${a.name} ${a.peak_concurrent ?? "—"}`).join(" · ")}`,
      ],
      action: {
        href: `/canales/${top.id}?tab=audiencia`,
        label: "Ver audiencia",
      },
    },
  ];
}

function buildConversationInsights(
  radar: RadarRow[],
  meta: MetaDiscovery,
  period: string,
  coverage: string
): TendenciaInsight[] {
  const insights: TendenciaInsight[] = [];
  const seen = new Set<string>();

  const candidates = radar
    .filter((r) => r.tema && (r.canales?.length || 0) >= 1)
    .filter((r) => r.cross_comunidad || (r.canales?.length || 0) >= 2 || r.multi_dia)
    .sort((a, b) => (b.menciones || 0) - (a.menciones || 0));

  for (const row of candidates) {
    if (insights.length >= 4) break;
    const momentum = serieMomentum(row.serie || []);
    const canales = row.canales || [];
    const key = row.tema.toLowerCase();
    if (seen.has(key)) continue;

    const isMulti = canales.length >= 2 || row.cross_comunidad;
    if (!isMulti && momentum !== "up") continue;

    seen.add(key);
    const temaLabel = row.tema.charAt(0).toUpperCase() + row.tema.slice(1);
    const channelPhrase = formatChannelList(canales);

    let pattern: string;
    if (momentum === "up") {
      pattern = `La conversación sobre ${temaLabel} viene en alza en ${channelPhrase}`;
    } else if (isMulti) {
      pattern = `La conversación sobre ${temaLabel} se sostiene en ${channelPhrase}`;
    } else {
      pattern = `Conversación recurrente sobre ${temaLabel} en ${channelPhrase}`;
    }

    const slug = CHANNEL_SLUG[canales[0]] || canales[0]?.toLowerCase();

    insights.push({
      id: `conv-${key.replace(/\s+/g, "-")}`,
      pattern,
      period,
      confidence: "conversacion",
      coverage: `${coverage} · señal conversacional, no verdad absoluta`,
      implication:
        row.candidato && isMulti
          ? "Varios streams hablan del tema con continuidad — explorá si hay espacio de sponsorship antes de que el rubro se sature."
          : "Útil para anticipar temas en reuniones de contenido o pauta contextual — validar con marcas del rubro.",
      signals: [
        `Menciones en transcript: ${row.menciones ?? "—"}`,
        `Canales: ${channelPhrase}`,
        momentum ? `Momentum reciente: ${momentum === "up" ? "alza" : momentum === "down" ? "baja" : "estable"}` : "",
      ].filter(Boolean),
      action: {
        href: slug ? `/canales/${slug}` : "/canales",
        label: "Ver canal",
      },
    });
  }

  return insights;
}

function buildOpportunityInsights(
  radar: RadarRow[],
  benchmark: BenchmarkRow[],
  meta: MetaDiscovery,
  period: string,
  coverage: string
): TendenciaInsight[] {
  const multiChannel = radar.filter(
    (r) => r.candidato && (r.canales?.length || 0) >= 2 && (r.menciones || 0) >= 8
  );
  if (!multiChannel.length) return [];

  const top = multiChannel.sort((a, b) => (b.menciones || 0) - (a.menciones || 0))[0];
  const temaLabel = top.tema.charAt(0).toUpperCase() + top.tema.slice(1);
  const totalBrands = benchmark.reduce((s, b) => s + (b.brands || 0), 0);

  return [
    {
      id: "opportunity-conversation",
      pattern: `Conversación transversal sobre ${temaLabel} — con poca pauta visible del rubro en el período`,
      period,
      confidence: "insight",
      coverage,
      implication:
        "Patrón de oportunidad comercial: conversación multi-canal sin saturación evidente de sponsors — vale mapear marcas del sector en Marcas.",
      signals: [
        `Conversación en: ${formatChannelList(top.canales || [])}`,
        `${top.menciones} menciones en transcripts del período`,
        `${totalBrands} marcas con pauta en total en canales capturados`,
      ],
      action: {
        href: "/marcas",
        label: "Explorar marcas",
      },
    },
  ];
}

function buildEmergingBrandsInsight(
  brands: { confidence_tier?: string; slug?: string }[],
  meta: MetaDiscovery,
  period: string,
  coverage: string
): TendenciaInsight[] {
  const emerging = brands.filter((b) => b.confidence_tier === "emerging_confidence").length;
  const solid = brands.filter((b) => b.confidence_tier === "high_confidence").length;
  if (emerging < 3) return [];

  return [
    {
      id: "emerging-brands-pipeline",
      pattern: `${emerging} marcas en señal temprana frente a ${solid} con actividad sólida`,
      period,
      confidence: "evidencia",
      coverage,
      implication:
        "El pipeline comercial está incorporando marcas nuevas — oportunidad para prospectar antes de que consoliden presencia en el ecosistema.",
      signals: [
        `Alta confianza: ${solid} marcas`,
        `Señal temprana: ${emerging} marcas`,
      ],
      action: {
        href: "/marcas",
        label: "Investigar marcas",
      },
    },
  ];
}

function buildSearchAnticipationInsights(
  radar: RadarRow[],
  period: string,
  coverage: string
): TendenciaInsight[] {
  const insights: TendenciaInsight[] = [];
  const priority = { adelantado: 0, pre_busqueda: 1 } as const;

  const rows = radar
    .filter(
      (r) =>
        r.tema &&
        (r.gt_status === "adelantado" || r.gt_status === "pre_busqueda") &&
        (r.canales?.length || 0) >= 1
    )
    .sort((a, b) => {
      const pa = priority[a.gt_status as keyof typeof priority] ?? 9;
      const pb = priority[b.gt_status as keyof typeof priority] ?? 9;
      return pa - pb || (b.menciones || 0) - (a.menciones || 0);
    });

  for (const row of rows.slice(0, 3)) {
    const temaLabel = row.tema.charAt(0).toUpperCase() + row.tema.slice(1);
    const channelPhrase = formatChannelList(row.canales || []);
    const slug = CHANNEL_SLUG[row.canales?.[0] || ""] || row.canales?.[0]?.toLowerCase();

    if (row.gt_status === "adelantado") {
      const days = row.gt_lead_days;
      insights.push({
        id: `gt-adelantado-${row.tema.replace(/\s+/g, "-")}`,
        pattern: `El vivo anticipó la conversación sobre ${temaLabel} antes de la búsqueda masiva`,
        period,
        confidence: "conversacion",
        coverage: `${coverage} · validación con búsqueda AR (experimental)`,
        implication:
          days && days > 0
            ? `Los streams hablaron del tema con ~${days} días de ventaja vs el despegue en búsqueda — útil para pauta contextual temprana.`
            : "El ecosistema capturado habló del tema antes de que Google registrara interés masivo — señal de anticipación, no de volumen comprobado.",
        signals: [
          `Conversación en: ${channelPhrase}`,
          `${row.menciones ?? "—"} menciones en transcripts`,
          "Búsqueda Argentina: interés posterior al pico en streaming",
          row.gt_lead_days != null ? `Anticipación estimada: ${row.gt_lead_days} días` : "",
        ].filter(Boolean),
        action: {
          href: slug ? `/canales/${slug}` : "/canales",
          label: "Ver canal",
        },
      });
    } else if (row.gt_status === "pre_busqueda") {
      insights.push({
        id: `gt-pre-${row.tema.replace(/\s+/g, "-")}`,
        pattern: `Conversación sobre ${temaLabel} en ${channelPhrase} sin volumen equivalente en búsqueda`,
        period,
        confidence: "conversacion",
        coverage: `${coverage} · validación con búsqueda AR (experimental)`,
        implication:
          "Todavía es conversación de nicho en vivo — no está masificada en búsqueda. Oportunidad para marcas que quieren asociarse antes del pico público.",
        signals: [
          `${row.menciones ?? "—"} menciones en transcripts del período`,
          "Búsqueda Argentina: sin volumen registrado comparable",
          row.candidato ? "Conversación sostenida en múltiples emisiones" : "",
        ].filter(Boolean),
        action: {
          href: "/marcas",
          label: "Explorar marcas",
        },
      });
    }
  }

  return insights;
}

export function buildTendencias(
  radar: RadarRow[],
  benchmark: BenchmarkRow[],
  audience: AudienceRow[],
  brands: { confidence_tier?: string; slug?: string; kind?: string }[],
  meta: MetaDiscovery
): TendenciaInsight[] {
  const period = periodLabel(meta);
  const coverage = coverageFooter(meta);
  const marcaBrands = brands.filter((b) => !b.kind || b.kind === "marca");

  const all = [
    ...buildCommercialInsights(benchmark, meta, period, coverage),
    ...buildAudienceInsights(audience, benchmark, meta, period, coverage),
    ...buildSearchAnticipationInsights(radar, period, coverage),
    ...buildOpportunityInsights(radar, benchmark, meta, period, coverage),
    ...buildEmergingBrandsInsight(marcaBrands, meta, period, coverage),
    ...buildConversationInsights(radar, meta, period, coverage),
  ];

  all.sort(
    (a, b) =>
      CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
      b.signals.length - a.signals.length
  );

  return all;
}

export function tendenciasSubline(count: number, meta: MetaDiscovery): string {
  const n = meta.discovery?.channels_covered ?? 3;
  return `${count} patrón${count === 1 ? "" : "es"} detectado${count === 1 ? "" : "s"} · ${n} canales · corpus exploratorio`;
}
