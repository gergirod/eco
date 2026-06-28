/**
 * ECO Guard — estado de monitoreo y alertas (push-first, no reporte).
 */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { compact, vodLink } from "@/lib/format";
import type { AgenciaAlert } from "@/lib/agencia-product";

type ReportRow = {
  name?: string;
  mentions?: number;
  best?: {
    date?: string;
    date_iso?: string;
    channel_name?: string;
    conc_at?: number | null;
    tier_label?: string;
    video_id?: string;
  };
  series?: { date_iso?: string; date?: string; mentions?: number }[];
};

export type GuardStatus = {
  active: boolean;
  brandCount: number;
  competitorCount: number;
  pntThisWeek: number;
  lastCaptureLabel: string;
  brandsMonitored: { slug: string; name: string; mentions: number }[];
  competitorsMonitored: { slug: string; name: string; mentions: number }[];
};

export function buildGuardStatus(
  pairs: readonly AgenciaBrandPair[],
  brandSlugs: string[],
  competitorSlugs: string[],
  reports: Record<string, ReportRow>,
  exportedAt?: string
): GuardStatus {
  const brandsMonitored = brandSlugs.map((slug) => ({
    slug,
    name: reports[slug]?.name || slug.replace(/-/g, " "),
    mentions: reports[slug]?.mentions ?? 0,
  }));
  const competitorsMonitored = competitorSlugs.map((slug) => ({
    slug,
    name: reports[slug]?.name || slug.replace(/-/g, " "),
    mentions: reports[slug]?.mentions ?? 0,
  }));
  const pntThisWeek = brandsMonitored.reduce((s, b) => s + b.mentions, 0);

  const lastCaptureLabel = exportedAt
    ? new Date(exportedAt).toLocaleString("es-AR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return {
    active: brandSlugs.length > 0,
    brandCount: brandSlugs.length,
    competitorCount: competitorSlugs.length,
    pntThisWeek,
    lastCaptureLabel,
    brandsMonitored,
    competitorsMonitored,
  };
}

export type PulseDelta = {
  brandName: string;
  brandSlug: string;
  thisWeek: number;
  priorMentions: number;
  deltaLabel: string;
  competitorName?: string;
  competitorMentions?: number;
  recommendation: string;
};

export function buildPulseDeltas(
  pairs: readonly AgenciaBrandPair[],
  reports: Record<string, ReportRow>
): PulseDelta[] {
  return pairs.map((pair) => {
    const report = reports[pair.slug];
    const comp = pair.competitorSlug ? reports[pair.competitorSlug] : null;
    const series = report?.series ?? [];
    const thisWeek = report?.mentions ?? 0;
    const priorMentions = Math.max(0, thisWeek - (series[series.length - 1]?.mentions ?? 0));

    let deltaLabel = `${thisWeek} PNT en el período`;
    if (comp) {
      const lead = thisWeek >= (comp.mentions ?? 0);
      deltaLabel += lead
        ? ` · liderás vs ${comp.name} (${comp.mentions ?? 0} PNT)`
        : ` · ${comp.name} más activo (${comp.mentions ?? 0} vs ${thisWeek})`;
    }

    const best = report?.best;
    let recommendation = "Sin activaciones nuevas — monitoreo activo para la próxima placa.";
    if (best?.conc_at && best.conc_at > 100000) {
      recommendation = `Repetir slot similar: ${best.channel_name}, minuto pico con ${compact(best.conc_at)} concurrentes. Llevá el link al viernes.`;
    } else if (best?.conc_at) {
      recommendation = `Última PNT con ${compact(best.conc_at)} mirando — revisá si el fee era por pico de programa o valle.`;
    }

    return {
      brandName: report?.name || pair.slug,
      brandSlug: pair.slug,
      thisWeek,
      priorMentions,
      deltaLabel,
      competitorName: comp?.name,
      competitorMentions: comp?.mentions,
      recommendation,
    };
  });
}

/** Preguntas clave para ECO Ask — no las 37 del briefing. */
export const ASK_PRESETS = [
  { id: "rindio", question: "¿Rindió la PNT de Wanderlust?" },
  { id: "cuantos", question: "¿Cuántos miraban cuando salió IOL?" },
  { id: "competencia", question: "¿Qué hizo Mercado Pago esta semana?" },
  { id: "lidera", question: "¿IOL lidera fintech en streaming?" },
  { id: "valle", question: "¿Salimos en valle o en pico?" },
  { id: "copy", question: "¿Qué copy usó Wanderlust?" },
  { id: "organico", question: "¿Hubo mención orgánica sin pauta?" },
  { id: "viernes", question: "¿Qué le digo al cliente el viernes?" },
] as const;

export function askAnswerFromBriefing(
  presetId: string,
  answers: { id: string; question: string; answer: string; pushCopy?: string; evidence?: { label: string; href: string; external?: boolean } }[]
): (typeof answers)[0] | null {
  const map: Record<string, string> = {
    rindio: "A1",
    cuantos: "A2",
    competencia: "B3",
    lidera: "B4",
    valle: "A5",
    copy: "A7",
    organico: "B6",
    viernes: "A9",
  };
  const bid = map[presetId];
  return answers.find((a) => a.id === bid) ?? answers.find((a) => a.id.startsWith("A")) ?? null;
}

export function guardPushPreview(alert: AgenciaAlert): string {
  const header = [alert.brandName, alert.channel, alert.program, alert.date]
    .filter(Boolean)
    .join(" · ");
  const lines = [
    header,
    alert.concAt
      ? `${compact(alert.concAt)} mirando`
      : "Placa detectada en stream.",
    alert.quote ? `"${alert.quote.slice(0, 140)}${alert.quote.length > 140 ? "…" : ""}"` : null,
    alert.videoId ? vodLink(alert.videoId, alert.tSeconds) : null,
  ].filter(Boolean);
  return lines.join("\n");
}
