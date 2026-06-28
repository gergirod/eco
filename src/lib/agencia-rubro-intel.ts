/**
 * Inteligencia de rubro — todo el vertical, no solo el competidor.
 * Marcas activas, copies que pegaron, horarios, demanda en chat.
 */

import { compact } from "@/lib/format";
import type { CommercialDemandExport } from "@/lib/commercialDemand";
import { filterCommercialByChannels } from "@/lib/commercialDemand";
import type { ChatInsightsExport } from "@/lib/chatInsights";
import { applyRubroToInsights } from "@/lib/chatInsights";
import { channelIdsForRubro, CHANNEL_NAME_TO_ID } from "@/lib/planningRubro";
import type { PlacementExport } from "@/lib/placement";
import { rubroLabel } from "@/lib/placement";
import {
  applyRubroToSchedule,
  type ScheduleInsightsExport,
} from "@/lib/scheduleInsights";
import { filterSalaSignals, type SalaSignalCard, type SalaSignalsExport } from "@/lib/sala-signals";

type Activation = {
  channel?: string;
  channel_name?: string;
  title?: string;
  minute?: string;
  quote?: string;
  tier_label?: string;
  conc_at?: number | null;
  program_peak?: number | null;
};

type ReportRow = {
  name?: string;
  mentions?: number;
  best?: Activation;
  detail?: Activation[];
};

export type RubroBrandRow = {
  slug: string;
  name: string;
  mentions: number;
  peakConc: number;
  channels: string[];
  channelLabel: string;
  role: "cliente" | "competidor" | "rubro";
};

export type RubroCopyRow = {
  slug: string;
  brandName: string;
  quote: string;
  concAt: number;
  channelName: string;
  program: string;
  minute: string;
  tierLabel: string;
  peakPct: number | null;
  salioFlojo: boolean;
};

/** Canales del corpus sin chat capturado esta semana — empty state honesto en demanda. */
export const CHANNELS_WITHOUT_CHAT = ["luzu"] as const;

export type RubroIntelPack = {
  rubroKey: string;
  rubroLabel: string;
  brandCount: number;
  totalPlacas: number;
  brands: RubroBrandRow[];
  copies: RubroCopyRow[];
  timingLine: string | null;
  bestHours: { label: string; avgPeak: number }[];
  bestWeekdays: { label: string; avgPeak: number }[];
  showLines: { line: string; avgPeak: number; channelId: string; showId: string }[];
  commercialSignals: string[];
  chatLine: string | null;
  /** Temas que explotaron en chat (sala agregada) */
  salaSignals: SalaSignalCard[];
  /** Canales del rubro donde no hay chat — ej. Luzu */
  channelsWithoutChat: string[];
  clientSlugs: string[];
  hasCompetitor: boolean;
};

function activations(report: ReportRow | null): Activation[] {
  if (!report) return [];
  return report.detail?.length ? [...report.detail] : report.best ? [report.best] : [];
}

function peakPct(act: Activation): number | null {
  const c = act.conc_at;
  const p = act.program_peak;
  if (c == null || p == null || p <= 0) return null;
  return Math.round((c / p) * 100);
}

export function buildRubroIntel(
  rubroKey: string,
  placement: PlacementExport | null,
  reports: Record<string, ReportRow>,
  schedule: ScheduleInsightsExport | null,
  commercial: CommercialDemandExport | null,
  chat: ChatInsightsExport | null,
  clientSlugs: string[],
  competitorSlugs: string[],
  salaSignalsExport?: SalaSignalsExport | null
): RubroIntelPack | null {
  if (!rubroKey || !placement?.brand_rubros) return null;

  const channelIds = channelIdsForRubro(placement, rubroKey);
  const filteredSchedule = applyRubroToSchedule(schedule ?? {}, channelIds);
  const filteredCommercial = filterCommercialByChannels(commercial, channelIds);
  const filteredChat = applyRubroToInsights(chat ?? { channels: [] }, channelIds, CHANNEL_NAME_TO_ID);

  const brands: RubroBrandRow[] = [];
  const copyCandidates: RubroCopyRow[] = [];

  for (const [slug, rubro] of Object.entries(placement.brand_rubros)) {
    if (rubro !== rubroKey) continue;
    const report = reports[slug];
    const mentions = report?.mentions ?? 0;
    if (mentions <= 0) continue;

    const acts = activations(report);
    const channels = [...new Set(acts.map((a) => a.channel_name || a.channel || "").filter(Boolean))];
    const peakConc = Math.max(...acts.map((a) => a.conc_at ?? 0), 0);

    let role: RubroBrandRow["role"] = "rubro";
    if (clientSlugs.includes(slug)) role = "cliente";
    else if (competitorSlugs.includes(slug)) role = "competidor";

    brands.push({
      slug,
      name: report?.name || slug,
      mentions,
      peakConc,
      channels,
      channelLabel: channels.slice(0, 3).join(", ") || "—",
      role,
    });

    for (const a of acts) {
      if (!a.quote || (a.conc_at ?? 0) <= 0) continue;
      const pct = peakPct(a);
      copyCandidates.push({
        slug,
        brandName: report?.name || slug,
        quote: a.quote.slice(0, 220),
        concAt: a.conc_at ?? 0,
        channelName: a.channel_name || a.channel || "—",
        program: a.title?.slice(0, 64) || "—",
        minute: a.minute || "—",
        tierLabel: a.tier_label || "—",
        peakPct: pct,
        salioFlojo: pct != null && pct < 40,
      });
    }
  }

  if (!brands.length) return null;

  brands.sort((a, b) => b.mentions - a.mentions || b.peakConc - a.peakConc);
  const copies = copyCandidates
    .sort((a, b) => b.concAt - a.concAt)
    .slice(0, 6);

  const commercialSignals: string[] = [];
  for (const sig of filteredCommercial?.signals?.slice(0, 4) ?? []) {
    commercialSignals.push(
      `«${sig.text.slice(0, 60)}${sig.text.length > 60 ? "…" : ""}» · ${sig.count}× en chat`
    );
  }
  for (const ch of filteredCommercial?.channels?.slice(0, 2) ?? []) {
    const ex = ch.top_examples?.[0];
    if (ex && !commercialSignals.some((s) => s.includes(ex.text.slice(0, 20)))) {
      commercialSignals.push(`En ${ch.name}: «${ex.text.slice(0, 55)}…»`);
    }
  }

  const showLines = (filteredSchedule.shows ?? []).slice(0, 6).map((s) => ({
    line: s.line,
    avgPeak: s.avg_peak,
    channelId: s.channel_id,
    showId: s.show_id,
  }));

  const channelsWithoutChat: string[] = [];
  const CHANNEL_NAMES: Record<string, string> = {
    luzu: "Luzu",
    olga: "Olga",
    bondi: "Bondi",
    blend: "Blender",
    gelatina: "Gelatina",
    neura: "Neura",
    urbana: "Urbana",
    vorterix: "Vorterix",
  };
  if (channelIds) {
    for (const id of channelIds) {
      if ((CHANNELS_WITHOUT_CHAT as readonly string[]).includes(id)) {
        channelsWithoutChat.push(CHANNEL_NAMES[id] ?? id);
      }
    }
  }

  return {
    rubroKey,
    rubroLabel: rubroLabel(placement, rubroKey),
    brandCount: brands.length,
    totalPlacas: brands.reduce((s, b) => s + b.mentions, 0),
    brands,
    copies,
    timingLine: filteredSchedule.platform_line ?? schedule?.platform_line ?? null,
    bestHours: (filteredSchedule.best_hours ?? schedule?.best_hours ?? []).slice(0, 4).map((h) => ({
      label: h.label,
      avgPeak: h.avg_peak,
    })),
    bestWeekdays: (filteredSchedule.best_weekdays ?? schedule?.best_weekdays ?? [])
      .slice(0, 3)
      .map((d) => ({ label: d.label, avgPeak: d.avg_peak })),
    showLines,
    commercialSignals: commercialSignals.slice(0, 5),
    chatLine: filteredChat.platform_line ?? null,
    salaSignals: filterSalaSignals(salaSignalsExport, channelIds, 6),
    channelsWithoutChat,
    clientSlugs,
    hasCompetitor: competitorSlugs.some((s) =>
      placement.brand_rubros[s] === rubroKey && (reports[s]?.mentions ?? 0) > 0
    ),
  };
}

/** Intel para todos los rubros del portfolio de la agencia */
export function buildPortfolioRubroIntel(
  rubroKeys: string[],
  placement: PlacementExport | null,
  reports: Record<string, ReportRow>,
  schedule: ScheduleInsightsExport | null,
  commercial: CommercialDemandExport | null,
  chat: ChatInsightsExport | null,
  clientSlugs: string[],
  competitorSlugs: string[],
  salaSignalsExport?: SalaSignalsExport | null
): RubroIntelPack[] {
  const seen = new Set<string>();
  const packs: RubroIntelPack[] = [];
  for (const key of rubroKeys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const pack = buildRubroIntel(
      key,
      placement,
      reports,
      schedule,
      commercial,
      chat,
      clientSlugs,
      competitorSlugs,
      salaSignalsExport
    );
    if (pack) packs.push(pack);
  }
  return packs;
}

export function rubroIntelSummary(pack: RubroIntelPack): string {
  const top = pack.brands[0];
  const parts = [
    `${pack.brandCount} marcas activas`,
    `${pack.totalPlacas} placas en total`,
    top ? `la que más salió: ${top.name} (${top.mentions})` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function formatCopyRow(row: RubroCopyRow): string {
  const pct =
    row.peakPct != null
      ? row.salioFlojo
        ? ` · salió flojo (${row.peakPct}%)`
        : ` · ${row.peakPct}% del mejor momento`
      : "";
  return `${compact(row.concAt)} mirando${pct}`;
}
