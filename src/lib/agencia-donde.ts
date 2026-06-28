/**
 * ECO agencia — dónde pautar y slots históricos (data real, sin agente).
 */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { compact } from "@/lib/format";
import type { ShowOpportunity } from "@/lib/opportunity";

type Activation = {
  channel?: string;
  channel_name?: string;
  date?: string;
  title?: string;
  video_id?: string;
  t_seconds?: number;
  minute?: string;
  tier_label?: string;
  conc_at?: number | null;
  program_peak?: number | null;
  retention_pct?: number | null;
  quote?: string;
};

type ReportRow = {
  name?: string;
  mentions?: number;
  best?: Activation;
  detail?: Activation[];
};

export type BrandSlot = {
  slug: string;
  brandName: string;
  channel: string;
  channelName: string;
  program: string;
  date: string;
  concAt: number;
  peakPct: number | null;
  programPeak: number | null;
  tierLabel: string;
  isValley: boolean;
  videoId: string;
  tSeconds: number;
  role: "cliente" | "competidor";
  quote?: string;
};

const VALLE_THRESHOLD = 40;

function peakPct(act: Activation): number | null {
  const c = act.conc_at;
  const p = act.program_peak;
  if (c == null || p == null || p <= 0) return null;
  return Math.round((c / p) * 100);
}

function isValley(act: Activation): boolean {
  const pct = peakPct(act);
  return pct != null && pct < VALLE_THRESHOLD;
}

function activations(report: ReportRow | null): Activation[] {
  if (!report) return [];
  const list = report.detail?.length ? [...report.detail] : report.best ? [report.best] : [];
  return list.sort((a, b) => (b.conc_at ?? 0) - (a.conc_at ?? 0));
}

export function buildBrandSlots(
  slug: string,
  report: ReportRow | null,
  role: "cliente" | "competidor"
): BrandSlot[] {
  return activations(report).map((a) => ({
    slug,
    brandName: report?.name || slug,
    channel: a.channel || "",
    channelName: a.channel_name || a.channel || "",
    program: a.title?.slice(0, 72) || "—",
    date: a.date || "",
    concAt: a.conc_at ?? 0,
    peakPct: peakPct(a),
    programPeak: a.program_peak ?? null,
    tierLabel: a.tier_label || "—",
    isValley: isValley(a),
    videoId: a.video_id || "",
    tSeconds: a.t_seconds ?? 0,
    role,
    quote: a.quote,
  }));
}

export type DondeRubroPack = {
  rubroKey: string;
  rubroLabel: string;
  clientBrand: string;
  clientSlug: string;
  competitorSlug: string | null;
  competitorName: string | null;
  clientSlots: BrandSlot[];
  competitorSlots: BrandSlot[];
  opportunities: ShowOpportunity[];
  avoidSlots: BrandSlot[];
  repeatSlots: BrandSlot[];
};

export function buildDondeRubroPack(
  pair: AgenciaBrandPair,
  rubroLabel: string,
  clientReport: ReportRow | null,
  competitorReport: ReportRow | null,
  opportunities: ShowOpportunity[]
): DondeRubroPack {
  const clientSlots = buildBrandSlots(pair.slug, clientReport, "cliente");
  const competitorSlots = pair.competitorSlug
    ? buildBrandSlots(pair.competitorSlug, competitorReport, "competidor")
    : [];

  const avoidSlots = clientSlots.filter((s) => s.isValley);
  const repeatSlots = clientSlots.filter((s) => !s.isValley && s.concAt > 50_000);

  return {
    rubroKey: pair.rubro,
    rubroLabel,
    clientBrand: clientReport?.name || pair.slug,
    clientSlug: pair.slug,
    competitorSlug: pair.competitorSlug,
    competitorName: competitorReport?.name || null,
    clientSlots,
    competitorSlots,
    opportunities,
    avoidSlots,
    repeatSlots,
  };
}

export function slotSummary(slot: BrandSlot): string {
  const pct = slot.peakPct != null ? `${slot.peakPct}% del mejor momento` : "sin dato de audiencia";
  return `${compact(slot.concAt)} mirando · ${slot.tierLabel} · ${pct}`;
}
