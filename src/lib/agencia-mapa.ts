/**
 * Mapa del corpus — competencia por rubro, temas por programa, oportunidades.
 */

import type { ChannelConfig } from "@/lib/channelProfile";
import { programsForChannel } from "@/lib/channelProfile";
import { buildRubroGapHints, buildShowOpportunities } from "@/lib/opportunity";
import {
  categoryLabel,
  getChannelPlacement,
  rubroLabel,
  type PlacementExport,
} from "@/lib/placement";
import { detectShowFormat, rollupsByShow } from "@/lib/showFormat";
import type { ScheduleInsightsExport } from "@/lib/scheduleInsights";

type Activation = {
  channel?: string;
  channel_name?: string;
  title?: string;
  conc_at?: number | null;
};

type ReportRow = {
  name?: string;
  mentions?: number;
  best?: Activation;
  detail?: Activation[];
};

export type RubroCompetitorRow = {
  slug: string;
  name: string;
  mentions: number;
  channels: string[];
  channelLabel: string;
  programs: string[];
  peakConc: number;
  role: "cliente" | "competidor" | "rubro";
};

export type ProgramMapRow = {
  id: string;
  channelId: string;
  channelName: string;
  showId: string;
  showName: string;
  peakAttention: number;
  topTemas: string[];
  charlaAngle: string | null;
  brandsInRubro: string[];
  rubroAbsent: boolean;
  pautaMentions: number;
  gapLabel: string | null;
  score: number;
  peakWindow: string | null;
  scheduleLine: string | null;
};

function activations(report: ReportRow | null): Activation[] {
  if (!report) return [];
  return report.detail?.length ? [...report.detail] : report.best ? [report.best] : [];
}

function showKey(channelId: string, showId: string): string {
  return `${channelId.toLowerCase()}:${showId}`;
}

function buildPeakByShow(
  channels: ChannelConfig[],
  audience: { id: string; top_programs?: { title: string; peak?: number }[] }[],
  reports: Record<string, ReportRow>,
  moments: Record<string, Record<string, unknown>>
): Map<string, number> {
  const audById = Object.fromEntries(audience.map((a) => [a.id, a]));
  const peaks = new Map<string, number>();

  for (const ch of channels.filter((c) => c.enabled)) {
    const programs = programsForChannel(reports, moments, ch.id);
    for (const r of rollupsByShow(programs)) {
      const key = showKey(ch.id, r.show.id);
      peaks.set(key, Math.max(peaks.get(key) || 0, r.peakAttention));
    }
    const aud = audById[ch.id];
    for (const tp of aud?.top_programs || []) {
      const show = detectShowFormat(ch.id, tp.title);
      const key = showKey(ch.id, show.id);
      peaks.set(key, Math.max(peaks.get(key) || 0, tp.peak || 0));
    }
  }

  return peaks;
}

export function portfolioRubroOptions(
  pairs: { rubro: string }[],
  placement: PlacementExport | null
): { id: string; label: string }[] {
  const seen = new Set<string>();
  const opts: { id: string; label: string }[] = [{ id: "", label: "Todos los rubros" }];
  for (const p of pairs) {
    if (seen.has(p.rubro)) continue;
    seen.add(p.rubro);
    opts.push({ id: p.rubro, label: rubroLabel(placement, p.rubro) });
  }
  for (const o of [
    "higiene",
    "viajes",
    "energia",
    "automotriz",
    "bebidas",
    "retail",
    "seguros",
    "telco",
  ]) {
    if (seen.has(o)) continue;
    seen.add(o);
    opts.push({ id: o, label: rubroLabel(placement, o) });
  }
  return opts;
}

export function buildRubroCompetitors(
  placement: PlacementExport | null,
  reports: Record<string, ReportRow>,
  rubroKey: string | null,
  clientSlugs: string[],
  competitorSlugs: string[]
): RubroCompetitorRow[] {
  if (!placement?.brand_rubros) return [];

  const rows: RubroCompetitorRow[] = [];

  for (const [slug, rubro] of Object.entries(placement.brand_rubros)) {
    if (rubroKey && rubro !== rubroKey) continue;
    const report = reports[slug];
    const mentions = report?.mentions ?? 0;
    if (mentions <= 0) continue;

    const acts = activations(report);
    const channels = [...new Set(acts.map((a) => a.channel_name || a.channel || "").filter(Boolean))];
    const programs = [
      ...new Set(
        acts.map((a) => {
          const ch = a.channel || "";
          const show = a.title ? detectShowFormat(ch, a.title) : null;
          return show ? `${a.channel_name || ch} · ${show.name}` : a.channel_name || ch;
        })
      ),
    ].filter(Boolean);
    const peakConc = Math.max(...acts.map((a) => a.conc_at ?? 0), 0);

    let role: RubroCompetitorRow["role"] = "rubro";
    if (clientSlugs.includes(slug)) role = "cliente";
    else if (competitorSlugs.includes(slug)) role = "competidor";

    rows.push({
      slug,
      name: report?.name || slug,
      mentions,
      channels,
      channelLabel: channels.slice(0, 3).join(", ") + (channels.length > 3 ? "…" : ""),
      programs,
      peakConc,
      role,
    });
  }

  return rows.sort((a, b) => b.mentions - a.mentions || b.peakConc - a.peakConc);
}

export function buildProgramMap(
  channels: ChannelConfig[],
  audience: { id: string; top_programs?: { title: string; peak?: number }[] }[],
  reports: Record<string, ReportRow>,
  moments: Record<string, Record<string, unknown>>,
  placement: PlacementExport | null,
  rubroKey: string | null,
  limit = 24,
  schedule?: ScheduleInsightsExport | null
): ProgramMapRow[] {
  if (!placement?.shows) return [];

  const chById = Object.fromEntries(channels.map((c) => [c.id, c]));
  const peaks = buildPeakByShow(channels, audience, reports, moments);
  const opportunities = buildShowOpportunities(
    channels,
    audience as never,
    reports as never,
    moments,
    placement,
    40,
    rubroKey
  );
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const gapKeys = new Set(
    buildRubroGapHints(channels, audience as never, reports as never, moments, placement, 30)
      .filter((h) => !rubroKey || h.rubroKey === rubroKey)
      .map((h) => `${h.channelId.toLowerCase()}:${h.showId}`)
  );

  const scheduleByKey = Object.fromEntries(
    (schedule?.shows ?? []).map((s) => [`${s.channel_id}:${s.show_id}`, s])
  );

  const rows: ProgramMapRow[] = [];

  for (const [key, showPl] of Object.entries(placement.shows)) {
    const peak = peaks.get(key) || 0;
    if (peak <= 0) continue;

    const channelId = showPl.channel_id;
    const rubroBrands =
      showPl.brand_mix
        ?.filter((b) => !rubroKey || b.rubro === rubroKey)
        .map((b) => b.name)
        .slice(0, 6) ?? [];

    const rubroAbsent = rubroKey
      ? !showPl.rubro_mix?.some((r) => r.key === rubroKey && r.count > 0)
      : false;

    if (rubroKey && !rubroAbsent && rubroBrands.length === 0 && peak < 10_000) continue;

    const topCat =
      showPl.categoria_mix?.find((c) => c.categoria !== "otro") ||
      showPl.categoria_mix?.[0] ||
      null;
    const opp = oppById[key];
    const pauta = showPl.pauta_mentions ?? 0;
    const sched = scheduleByKey[`${channelId}:${showPl.show_id}`];
    const score =
      opp?.score ??
      (rubroAbsent && peak >= 15_000 ? peak / Math.max(pauta, 0.5) : peak / Math.max(pauta + 1, 1));

    rows.push({
      id: key,
      channelId,
      channelName: chById[channelId]?.name || channelId,
      showId: showPl.show_id,
      showName: showPl.show_name,
      peakAttention: peak,
      topTemas: (showPl.top_temas ?? []).slice(0, 4).map((t) => t.tema),
      charlaAngle: topCat ? categoryLabel(topCat.categoria) : null,
      brandsInRubro: rubroBrands,
      rubroAbsent: rubroAbsent || gapKeys.has(key),
      pautaMentions: pauta,
      gapLabel: opp?.gapLabel ?? (gapKeys.has(key) ? "Rubro fuerte en el canal, ausente acá" : null),
      score,
      peakWindow: sched?.peak_window ?? null,
      scheduleLine: sched?.line ?? null,
    });
  }

  return rows
    .sort((a, b) => b.score - a.score || b.peakAttention - a.peakAttention)
    .slice(0, limit);
}

export function channelTopicsSummary(
  placement: PlacementExport | null,
  channelId: string
): string[] {
  const ch = getChannelPlacement(placement, channelId);
  return (ch?.top_temas ?? []).slice(0, 5).map((t) => t.tema);
}
