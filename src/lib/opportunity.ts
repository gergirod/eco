/**
 * Oportunidades de placement: alta atención medida + poca densidad de pauta.
 * Une placement.json, rollups de programas y audiencia — sin pipeline nuevo.
 */

import type { ChannelAudience, ChannelConfig } from "./channelProfile";
import { programsForChannel } from "./channelProfile";
import {
  categoryLabel,
  getChannelPlacement,
  getShowPlacement,
  rubroLabel,
  type PlacementExport,
} from "./placement";
import { detectShowFormat, rollupsByShow } from "./showFormat";

export type ShowOpportunity = {
  id: string;
  channelId: string;
  channelName: string;
  showId: string;
  showName: string;
  peakAttention: number;
  pautaMentions: number;
  emissions: number;
  pautaPerEmission: number;
  gapLabel: string;
  topRubroLabel: string | null;
  charlaAngle: string | null;
  score: number;
};

export type RubroGapHint = {
  id: string;
  channelId: string;
  channelName: string;
  showId: string;
  showName: string;
  rubroKey: string;
  rubroLabel: string;
  peakAttention: number;
  channelRubroPct: number;
  showRubroCount: number;
  summary: string;
};

function showKey(channelId: string, showId: string): string {
  return `${channelId.toLowerCase()}:${showId}`;
}

function buildPeakByShow(
  channels: ChannelConfig[],
  audience: ChannelAudience[],
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>,
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

function gapLabel(pautaMentions: number, pautaPerEmission: number): string {
  if (pautaMentions === 0) {
    return "Alta atención · sin pauta verificada en el período";
  }
  if (pautaPerEmission < 2) {
    return "Alta atención · poca densidad de pauta";
  }
  return "Atención sólida · pauta moderada";
}

export function buildShowOpportunities(
  channels: ChannelConfig[],
  audience: ChannelAudience[],
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>,
  moments: Record<string, Record<string, unknown>>,
  placement: PlacementExport | null,
  limit = 10
): ShowOpportunity[] {
  if (!placement?.shows) return [];

  const chById = Object.fromEntries(channels.map((c) => [c.id, c]));
  const peaks = buildPeakByShow(channels, audience, reports, moments);
  const rows: ShowOpportunity[] = [];

  for (const [key, showPl] of Object.entries(placement.shows)) {
    const peak = peaks.get(key) || 0;
    if (peak <= 0) continue;

    const emissions = Math.max(showPl.emissions ?? 1, 1);
    const pautaMentions = showPl.pauta_mentions ?? 0;
    const pautaPerEmission = pautaMentions / emissions;
    const score = peak / Math.max(pautaPerEmission, 0.5);

    const topRubro =
      showPl.rubro_mix?.find((r) => r.key !== "otro") || showPl.rubro_mix?.[0] || null;
    const topCat =
      showPl.categoria_mix?.find((c) => c.categoria !== "otro") ||
      showPl.categoria_mix?.[0] ||
      null;

    const channelId = showPl.channel_id;
    const ch = chById[channelId];

    rows.push({
      id: key,
      channelId,
      channelName: ch?.name || channelId,
      showId: showPl.show_id,
      showName: showPl.show_name,
      peakAttention: peak,
      pautaMentions,
      emissions,
      pautaPerEmission,
      gapLabel: gapLabel(pautaMentions, pautaPerEmission),
      topRubroLabel: topRubro ? topRubro.label : null,
      charlaAngle: topCat ? categoryLabel(topCat.categoria) : null,
      score,
    });
  }

  return rows
    .filter((r) => r.pautaPerEmission < 4 || r.pautaMentions === 0)
    .sort((a, b) => b.score - a.score || b.peakAttention - a.peakAttention)
    .slice(0, limit);
}

export function buildRubroGapHints(
  channels: ChannelConfig[],
  audience: ChannelAudience[],
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>,
  moments: Record<string, Record<string, unknown>>,
  placement: PlacementExport | null,
  limit = 6
): RubroGapHint[] {
  if (!placement) return [];

  const chById = Object.fromEntries(channels.map((c) => [c.id, c]));
  const peaks = buildPeakByShow(channels, audience, reports, moments);
  const hints: RubroGapHint[] = [];

  for (const ch of channels.filter((c) => c.enabled)) {
    const chPlacement = getChannelPlacement(placement, ch.id);
    const dominant = chPlacement?.rubro_mix?.find((r) => r.key !== "otro");
    if (!dominant || dominant.pct < 15) continue;

    for (const [key, showPl] of Object.entries(placement.shows)) {
      if (!key.startsWith(`${ch.id.toLowerCase()}:`)) continue;
      const peak = peaks.get(key) || 0;
      if (peak < 15_000) continue;

      const showRubro = showPl.rubro_mix?.find((r) => r.key === dominant.key);
      const showCount = showRubro?.count ?? 0;
      if (showCount > 0) continue;

      hints.push({
        id: `${key}:${dominant.key}`,
        channelId: ch.id,
        channelName: chById[ch.id]?.name || ch.id,
        showId: showPl.show_id,
        showName: showPl.show_name,
        rubroKey: dominant.key,
        rubroLabel: rubroLabel(placement, dominant.key),
        peakAttention: peak,
        channelRubroPct: dominant.pct,
        showRubroCount: showCount,
        summary: `${dominant.label} concentra ${dominant.pct}% de la pauta en ${chById[ch.id]?.name || ch.id}, pero ${showPl.show_name} no registró marcas de ese rubro.`,
      });
    }
  }

  return hints
    .sort((a, b) => b.peakAttention - a.peakAttention)
    .slice(0, limit);
}
