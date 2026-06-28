/**
 * Capa de producto agencia — enriquece el corpus exportado para la demo /agencia.
 */

import placementFile from "@/data/placement.json";
import { compact, vodLink } from "./format";
import { rubroLabel } from "./placement";
import type { AgenciaBrandPair } from "./agencia-demo";

type BrandRow = {
  slug: string;
  name: string;
  value_usd?: number;
  mentions?: number;
  channels?: string[];
  peak_conc_at?: number | null;
};

type ReportRow = {
  name?: string;
  kind?: string;
  mentions?: number;
  value_usd?: number;
  by_tier?: Record<string, number>;
  by_sentiment?: Record<string, number>;
  best?: ActivationRow;
  detail?: ActivationRow[];
};

type ActivationRow = {
  channel?: string;
  channel_name?: string;
  date?: string;
  video_id?: string;
  title?: string;
  minute?: string;
  t_seconds?: number;
  quote?: string;
  tier?: number;
  tier_label?: string;
  sentiment?: string;
  conc_at?: number | null;
  program_peak?: number | null;
  evidence?: string;
  evidence_reason?: string;
  has_chat?: boolean;
  chat_ratio?: number | null;
  retention_pct?: number | null;
  value_usd?: number;
  transcript_at_ts?: string;
  chat_reaction?: {
    headline?: string;
    table_line?: string;
    tone?: string;
    has_chat?: boolean;
    cobertura?: boolean;
    ejemplos?: string[];
    eco_line?: string | null;
  };
};

const VALLE_THRESHOLD = 40;

const CHAT_UNMEASURABLE = [
  "Sin chat capturado",
  "Chat no cubre",
  "no podemos medir",
  "reacción no medible",
  "Sin chat en",
];

function activationsForReport(report: ReportRow | undefined): ActivationRow[] {
  if (!report) return [];
  if (report.detail?.length) return report.detail.filter((a) => a.video_id);
  if (report.best?.video_id) return [report.best];
  return [];
}

/** Texto corto de reacción de sala para card y WhatsApp. */
export function formatChatForActivation(
  act: ActivationRow,
  channelLabel: string
): {
  tableLine: string;
  tone: string;
  measurable: boolean;
  ejemplos: string[];
  copyLine: string;
} {
  const cr = act.chat_reaction;
  const ch = (channelLabel || act.channel_name || act.channel || "").toLowerCase();
  const isLuzu = ch.includes("luzu");

  if (isLuzu || !cr) {
    const line = isLuzu
      ? "En Luzu no capturamos chat — el dato es cuánta gente miraba."
      : "Sin chat en este minuto.";
    return {
      tableLine: line,
      tone: "none",
      measurable: false,
      ejemplos: [],
      copyLine: isLuzu ? "Sin chat en Luzu (solo concurrentes)." : line,
    };
  }

  const table = cr.table_line?.trim() || "";
  const headline = cr.headline?.trim() || "";
  const unmeasurable =
    !cr.has_chat ||
    cr.cobertura === false ||
    CHAT_UNMEASURABLE.some((s) => table.includes(s) || headline.includes(s));

  if (unmeasurable) {
    const line =
      table ||
      headline.slice(0, 140) ||
      "Chat no alcanza este minuto — reacción no medible.";
    return {
      tableLine: line,
      tone: cr.tone || "none",
      measurable: false,
      ejemplos: [],
      copyLine: line.slice(0, 120),
    };
  }

  const ejemplos = (cr.ejemplos ?? []).filter(Boolean).slice(0, 3);
  let copyLine = table || headline.slice(0, 100);
  if (cr.eco_line) copyLine += ` · ${cr.eco_line}`;
  else if (ejemplos[0] && cr.tone === "up") {
    copyLine += ` · «${ejemplos[0].slice(0, 55)}${ejemplos[0].length > 55 ? "…" : ""}»`;
  }

  return {
    tableLine: table || headline.slice(0, 160),
    tone: cr.tone || "none",
    measurable: true,
    ejemplos,
    copyLine,
  };
}

function peakPctAct(act: ActivationRow): number | null {
  const c = act.conc_at;
  const p = act.program_peak;
  if (c == null || p == null || p <= 0) return null;
  return Math.round((c / p) * 100);
}

function isValley(act: ActivationRow): boolean {
  const pct = peakPctAct(act);
  return pct != null && pct < VALLE_THRESHOLD;
}

type MetaRoot = {
  exported_at?: string;
  n_videos?: number;
  n_topics?: number;
  n_topics_total?: number;
  n_brands?: number;
  n_pauta_mentions?: number;
  n_moments?: number;
  live_capture?: {
    hours_captured?: number;
    channels_captured?: number;
    streams_captured?: number;
  };
  discovery?: {
    activations_with_verified_evidence?: number;
    programs_with_viewers?: number;
  };
};

export type AgenciaAlert = {
  id: string;
  brandSlug: string;
  brandName: string;
  channel: string;
  program: string;
  date: string;
  headline: string;
  body: string;
  quote: string;
  tierLabel: string;
  concAt: number | null;
  programPeak: number | null;
  videoId: string;
  tSeconds: number;
  evidence: string;
  chatTableLine: string;
  chatTone: string;
  chatMeasurable: boolean;
  chatEjemplos: string[];
  chatCopyLine: string;
};

export type RubroShareRow = {
  slug: string;
  name: string;
  valueUsd: number;
  mentions: number;
  sharePct: number;
  role: "cliente" | "competidor" | "rubro";
};

export type CorpusLayer = {
  id: string;
  label: string;
  used: boolean;
  detail: string;
};

export type PresetAnswer = {
  id: string;
  question: string;
  answer: string;
  evidence?: {
    label: string;
    href: string;
    external?: boolean;
  };
  layers: string[];
};

const PLACEMENT = placementFile as {
  brand_rubros?: Record<string, string>;
};

function brandRubro(slug: string): string {
  return PLACEMENT.brand_rubros?.[slug] || "otro";
}

export function buildAgenciaAlerts(
  pairs: readonly AgenciaBrandPair[],
  reports: Record<string, ReportRow>
): AgenciaAlert[] {
  const alerts: AgenciaAlert[] = [];
  const seen = new Set<string>();

  function pushActivation(slug: string, act: ActivationRow) {
    if (!act.video_id) return;
    const id = `${slug}-${act.video_id}-${act.t_seconds ?? 0}`;
    if (seen.has(id)) return;
    seen.add(id);

    const report = reports[slug];
    const channel = act.channel_name || act.channel || "";
    const peak = act.program_peak ?? null;
    const conc = act.conc_at ?? null;
    const peakPct =
      peak && conc && peak > 0 ? Math.round((conc / peak) * 100) : null;
    const chat = formatChatForActivation(act, channel);

    alerts.push({
      id,
      brandSlug: slug,
      brandName: report?.name || slug,
      channel,
      program: act.title?.trim() || "",
      date: act.date || "",
      headline: `${report?.name || slug} · ${channel || "streaming"}${isValley(act) ? " · ⚠️ salió flojo" : ""}`,
      body: [
        conc ? `${compact(conc)} mirando cuando dijeron la marca` : null,
        act.tier_label ? act.tier_label : null,
        peakPct != null ? `${peakPct}% del mejor momento del programa` : null,
        act.sentiment ? `tono ${act.sentiment}` : null,
        chat.measurable ? chat.tableLine : null,
      ]
        .filter(Boolean)
        .join(" · "),
      tierLabel: act.tier_label || "Mención en pantalla",
      quote: act.quote?.trim() || "",
      concAt: conc,
      programPeak: peak,
      videoId: act.video_id,
      tSeconds: act.t_seconds ?? 0,
      evidence: act.evidence || "PARTIAL",
      chatTableLine: chat.tableLine,
      chatTone: chat.tone,
      chatMeasurable: chat.measurable,
      chatEjemplos: chat.ejemplos,
      chatCopyLine: chat.copyLine,
    });
  }

  for (const pair of pairs) {
    for (const act of activationsForReport(reports[pair.slug])) {
      pushActivation(pair.slug, act);
    }
    if (pair.competitorSlug) {
      for (const act of activationsForReport(reports[pair.competitorSlug])) {
        pushActivation(pair.competitorSlug, act);
      }
    }
  }

  return alerts.sort((a, b) => (b.concAt ?? 0) - (a.concAt ?? 0));
}

export function buildRubroShare(
  rubroKey: string,
  brands: BrandRow[],
  reports: Record<string, ReportRow>,
  focusSlugs: string[]
): RubroShareRow[] {
  const inRubro = brands.filter((b) => brandRubro(b.slug) === rubroKey);
  const total = inRubro.reduce((s, b) => s + (reports[b.slug]?.value_usd ?? b.value_usd ?? 0), 0);

  return inRubro
    .map((b) => {
      const valueUsd = reports[b.slug]?.value_usd ?? b.value_usd ?? 0;
      const mentions = reports[b.slug]?.mentions ?? b.mentions ?? 0;
      let role: RubroShareRow["role"] = "rubro";
      if (focusSlugs.includes(b.slug)) role = "cliente";
      else if (focusSlugs.some((s) => PLACEMENT.brand_rubros?.[s] === rubroKey && s !== b.slug)) {
        // competitor slugs passed separately — check via focus list
      }
      return {
        slug: b.slug,
        name: b.name,
        valueUsd,
        mentions,
        sharePct: total > 0 ? (valueUsd / total) * 100 : 0,
        role,
      };
    })
    .filter((r) => r.valueUsd > 0 || r.mentions > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .map((r) => ({
      ...r,
      role: focusSlugs.includes(r.slug)
        ? "cliente"
        : focusSlugs.length && !focusSlugs.includes(r.slug) && r.role === "rubro"
          ? "rubro"
          : r.role,
    }));
}

export function markCompetitorsInRubro(
  rows: RubroShareRow[],
  competitorSlugs: string[]
): RubroShareRow[] {
  return rows.map((r) =>
    competitorSlugs.includes(r.slug) ? { ...r, role: "competidor" as const } : r
  );
}

export function buildCorpusLayersForBrand(
  slug: string,
  report: ReportRow | null,
  meta: MetaRoot
): CorpusLayer[] {
  const best = report?.best;
  const detail = report?.detail?.length ?? report?.mentions ?? 0;

  return [
    {
      id: "transcript",
      label: "Transcripción",
      used: Boolean(best?.quote),
      detail: best?.quote ? "Cita verificada en transcript" : "Sin cita en período",
    },
    {
      id: "viewers",
      label: "Concurrentes al segundo",
      used: best?.conc_at != null && best.conc_at > 0,
      detail:
        best?.conc_at != null
          ? `${compact(best.conc_at)} en el minuto exacto`
          : "Sin serie de audiencia",
    },
    {
      id: "tier",
      label: "Clasificación formato",
      used: best?.tier != null,
      detail: best?.tier_label || "Sin tier",
    },
    {
      id: "peak",
      label: "Pico del programa",
      used: best?.program_peak != null,
      detail:
        best?.program_peak != null
          ? `Pico ${compact(best.program_peak)} · retención ${best.retention_pct ?? 0}%`
          : "Sin benchmark de programa",
    },
    {
      id: "valuation",
      label: "Valorización atención",
      used: (report?.value_usd ?? 0) > 0,
      detail: report?.value_usd ? `USD ${Math.round(report.value_usd).toLocaleString("es-AR")} período` : "—",
    },
    {
      id: "chat",
      label: "Reacción sala (chat)",
      used: Boolean(best?.has_chat || best?.chat_reaction?.headline),
      detail: best?.chat_reaction?.headline
        ? best.chat_reaction.headline.slice(0, 80)
        : best?.has_chat
          ? `Ratio chat ${best?.chat_ratio ?? "—"}`
          : "Sin chat capturado en este programa",
    },
    {
      id: "activations",
      label: "Activaciones en corpus",
      used: detail > 0,
      detail: `${detail} PNT${detail === 1 ? "" : "s"} con evidencia`,
    },
    {
      id: "ecosystem",
      label: "Ecosistema capturado",
      used: Boolean(meta.live_capture?.channels_captured),
      detail: `${meta.live_capture?.channels_captured ?? 0} canales · ${Math.round(meta.live_capture?.hours_captured ?? 0)}h vivo`,
    },
  ];
}

export function buildCorpusSummary(meta: MetaRoot, brandSlugs: string[], reports: Record<string, ReportRow>) {
  const clientActivations = brandSlugs.reduce(
    (s, slug) => s + (reports[slug]?.mentions ?? 0),
    0
  );
  const verified = brandSlugs.reduce((s, slug) => {
    const r = reports[slug];
    const n = r?.detail?.filter((d) => d.evidence === "VERIFIED").length ?? 0;
    return s + (n || (r?.best?.evidence === "VERIFIED" ? 1 : 0));
  }, 0);

  return {
    exportedAt: meta.exported_at || "",
    videos: meta.n_videos ?? 0,
    topics: meta.n_topics_total ?? meta.n_topics ?? 0,
    brands: meta.n_brands ?? 0,
    pautaMentions: meta.n_pauta_mentions ?? 0,
    moments: meta.n_moments ?? 0,
    hoursCaptured: meta.live_capture?.hours_captured ?? 0,
    channelsCaptured: meta.live_capture?.channels_captured ?? 0,
    clientActivations,
    clientVerified: verified,
    programsWithViewers: meta.discovery?.programs_with_viewers ?? 0,
  };
}

export function buildPresetAnswers(
  reports: Record<string, ReportRow>,
  rubroFintech: RubroShareRow[]
): PresetAnswer[] {
  const iol = reports["iol-inversiones"];
  const wanderlust = reports["wanderlust"];
  const mp = reports["mercado-pago"];
  const iolBest = iol?.best;
  const wlBest = wanderlust?.best;

  const iolShare = rubroFintech.find((r) => r.slug === "iol-inversiones");
  const mpShare = rubroFintech.find((r) => r.slug === "mercado-pago");

  const answers: PresetAnswer[] = [];

  if (iolShare) {
    answers.push({
      id: "iol-lidera",
      question: "¿IOL lidera fintech en streaming esta semana?",
      answer: `Sí — IOL concentra el ${iolShare.sharePct.toFixed(0)}% de la exposición estimada en fintech del período (${iol?.mentions ?? 0} PNT, USD ${Math.round(iol?.value_usd ?? 0).toLocaleString("es-AR")}).${
        mpShare
          ? ` Mercado Pago: ${mpShare.sharePct.toFixed(0)}% (${mp?.mentions ?? 0} PNT).`
          : ""
      }`,
      evidence: iolBest?.video_id
        ? {
            label: "Ver mejor momento IOL",
            href: `/agencia/marcas/iol-inversiones`,
          }
        : undefined,
      layers: ["transcript", "viewers", "tier", "valuation"],
    });
  }

  if (wlBest?.video_id) {
    answers.push({
      id: "wanderlust-cuando",
      question: "¿Cuándo corrió Wanderlust y cuántos miraban?",
      answer: `${wlBest.date} en ${wlBest.channel_name} — ${wlBest.tier_label}, ${compact(wlBest.conc_at ?? 0)} concurrentes en el minuto ${wlBest.minute}. Pico del programa: ${compact(wlBest.program_peak ?? 0)}.`,
      evidence: {
        label: "Link al segundo",
        href: vodLink(wlBest.video_id, wlBest.t_seconds ?? 0),
        external: true,
      },
      layers: ["transcript", "viewers", "peak", "tier"],
    });
  }

  if (iolBest?.quote) {
    answers.push({
      id: "iol-copy",
      question: "¿Qué copy usó IOL en su mejor momento?",
      answer: `«${iolBest.quote.slice(0, 220)}${iolBest.quote.length > 220 ? "…" : ""}» — ${iolBest.tier_label}, ${compact(iolBest.conc_at ?? 0)} mirando.`,
      evidence: {
        label: "Evidencia IOL",
        href: `/agencia/marcas/iol-inversiones`,
      },
      layers: ["transcript", "tier", "sentiment"],
    });
  }

  if (mp && iol) {
    answers.push({
      id: "mp-vs-iol",
      question: "¿Cómo viene Mercado Pago vs IOL?",
      answer: `IOL: ${iol.mentions} apariciones · MP: ${mp.mentions}. Exposición estimada IOL USD ${Math.round(iol.value_usd ?? 0).toLocaleString("es-AR")} vs MP USD ${Math.round(mp.value_usd ?? 0).toLocaleString("es-AR")}. IOL domina lectura dedicada (Tier 2: ${iol.by_tier?.["2"] ?? 0} vs ${mp.by_tier?.["2"] ?? 0}).`,
      evidence: {
        label: "Comparar en Competencia",
        href: "/agencia/competencia",
      },
      layers: ["valuation", "tier", "activations"],
    });
  }

  return answers;
}

export function rubroDisplay(key: string): string {
  return rubroLabel(placementFile as Parameters<typeof rubroLabel>[0], key);
}
