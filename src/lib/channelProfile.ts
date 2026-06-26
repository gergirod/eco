/**
 * Channel profile data layer — joins export JSON for ARCH-001 Canales depth.
 */

import type { EvidenceLevel } from "./campaign";
import { buildProgramsIndex, marcaReportsOnly, type Program } from "./programs";

export type ChannelConfig = {
  id: string;
  name: string;
  url?: string;
  genre?: string;
  subscribers?: string;
  enabled: boolean;
  has_data: boolean;
  pipeline_status?: string;
  stats?: {
    videos_processed?: number;
    total_vod_views?: number;
    avg_concurrent?: number;
    brands_detected?: number;
    mentions?: number;
    last_processed?: string;
  };
};

export type ChannelAudience = {
  id: string;
  name: string;
  videos: number;
  avg_concurrent: number;
  peak_concurrent: number;
  chat_coverage?: number;
  chat_msgs_per_1k_min?: number | null;
  chat_quality_tier?: string;
  chat_quality_label?: string;
  chat_noise_score?: number | null;
  top_programs?: { title: string; peak: number; video_id: string }[];
  top_programs_by_chat?: { title: string; video_id: string; chat_engagement: number }[];
};

export type ChannelBrandRef = {
  slug: string;
  name: string;
  mentions: number;
  value_usd?: number;
};

export type ChannelBenchmark = {
  id: string;
  name: string;
  videos: number;
  vod_views?: number;
  avg_concurrent?: number;
  brands: number;
  mentions: number;
  share_views?: number;
  top_brands?: ChannelBrandRef[];
};

export type ChannelActivation = {
  brand_slug: string;
  brand_name: string;
  channel: string;
  channel_name: string;
  date: string;
  video_id: string;
  title: string;
  minute: string;
  t_seconds: number;
  quote: string;
  evidence: EvidenceLevel | string;
  evidence_reason?: string;
  conc_at: number | null;
  tier: number;
  tier_label?: string;
  value_usd?: number;
};

export type ChannelEvidenceSummary = {
  verified: number;
  partial: number;
  insufficient: number;
  total: number;
};

export type ChannelProfile = {
  config: ChannelConfig;
  audience: ChannelAudience | null;
  benchmark: ChannelBenchmark | null;
  programs: Program[];
  activations: ChannelActivation[];
  evidenceSummary: ChannelEvidenceSummary;
  hasCapture: boolean;
};

export type ChannelBrowseItem = {
  id: string;
  name: string;
  hasCapture: boolean;
  avgConcurrent: number | null;
  peakConcurrent: number | null;
  brands: number;
  mentions: number;
  shareViews: number | null;
  topBrandName: string | null;
};

function mapActivation(
  slug: string,
  brandName: string,
  row: Record<string, unknown>
): ChannelActivation | null {
  const channel = String(row.channel || "");
  if (!channel) return null;
  return {
    brand_slug: slug,
    brand_name: brandName,
    channel,
    channel_name: String(row.channel_name || channel),
    date: String(row.date || ""),
    video_id: String(row.video_id || ""),
    title: String(row.title || ""),
    minute: String(row.minute || ""),
    t_seconds: Number(row.t_seconds || 0),
    quote: String(row.quote || ""),
    evidence: String(row.evidence || ""),
    evidence_reason: row.evidence_reason ? String(row.evidence_reason) : undefined,
    conc_at: row.conc_at != null && Number(row.conc_at) > 0 ? Number(row.conc_at) : null,
    tier: Number(row.tier || 0),
    tier_label: row.tier_label ? String(row.tier_label) : undefined,
    value_usd: row.value_usd != null ? Number(row.value_usd) : undefined,
  };
}

export function activationsForChannel(
  reports: Record<string, { name: string; kind?: string; detail?: Record<string, unknown>[] }>,
  channelId: string
): ChannelActivation[] {
  const id = channelId.toLowerCase();
  const rows: ChannelActivation[] = [];
  for (const [slug, report] of Object.entries(reports)) {
    if (report.kind && report.kind !== "marca") continue;
    for (const d of report.detail || []) {
      if (String(d.channel || "").toLowerCase() !== id) continue;
      const mapped = mapActivation(slug, report.name, d);
      if (mapped) rows.push(mapped);
    }
  }
  rows.sort((a, b) => {
    const da = a.date.split("/").reverse().join("");
    const db = b.date.split("/").reverse().join("");
    return db.localeCompare(da) || (b.conc_at || 0) - (a.conc_at || 0);
  });
  return rows;
}

export function summarizeChannelEvidence(activations: ChannelActivation[]): ChannelEvidenceSummary {
  const summary = { verified: 0, partial: 0, insufficient: 0, total: activations.length };
  for (const a of activations) {
    if (a.evidence === "VERIFIED") summary.verified++;
    else if (a.evidence === "PARTIAL_EVIDENCE") summary.partial++;
    else if (a.evidence === "INSUFFICIENT_EVIDENCE") summary.insufficient++;
  }
  return summary;
}

export function programsForChannel(
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>,
  moments: Record<string, Record<string, unknown>>,
  channelId: string
): Program[] {
  const id = channelId.toLowerCase();
  return buildProgramsIndex(marcaReportsOnly(reports), moments).filter((p) => p.channel.toLowerCase() === id);
}

export function getChannelProfile(
  channelId: string,
  channels: ChannelConfig[],
  audience: ChannelAudience[],
  benchmark: ChannelBenchmark[],
  reports: Record<string, { name: string; kind?: string; detail?: Record<string, unknown>[] }>,
  moments: Record<string, Record<string, unknown>>
): ChannelProfile | null {
  const config = channels.find((c) => c.id.toLowerCase() === channelId.toLowerCase());
  if (!config) return null;

  const aud = audience.find((a) => a.id.toLowerCase() === config.id.toLowerCase()) || null;
  const bench = benchmark.find((b) => b.id.toLowerCase() === config.id.toLowerCase()) || null;
  const activations = activationsForChannel(reports, config.id);
  const programs = programsForChannel(reports, moments, config.id);

  return {
    config,
    audience: aud,
    benchmark: bench,
    programs,
    activations,
    evidenceSummary: summarizeChannelEvidence(activations),
    hasCapture: Boolean(aud || bench || activations.length),
  };
}

export function listChannelBrowseItems(
  channels: ChannelConfig[],
  audience: ChannelAudience[],
  benchmark: ChannelBenchmark[]
): ChannelBrowseItem[] {
  const audById = Object.fromEntries(audience.map((a) => [a.id, a]));
  const benchById = Object.fromEntries(benchmark.map((b) => [b.id, b]));

  return channels
    .filter((c) => c.enabled)
    .map((c) => {
      const aud = audById[c.id];
      const bench = benchById[c.id];
      const topBrand = bench?.top_brands?.[0];
      return {
        id: c.id,
        name: c.name,
        hasCapture: Boolean(aud || bench),
        avgConcurrent: aud?.avg_concurrent ?? c.stats?.avg_concurrent ?? null,
        peakConcurrent: aud?.peak_concurrent ?? null,
        brands: bench?.brands ?? c.stats?.brands_detected ?? 0,
        mentions: bench?.mentions ?? c.stats?.mentions ?? 0,
        shareViews: bench?.share_views ?? null,
        topBrandName: topBrand?.name ?? null,
      };
    })
    .sort((a, b) => {
      if (a.hasCapture !== b.hasCapture) return a.hasCapture ? -1 : 1;
      return (b.avgConcurrent ?? 0) - (a.avgConcurrent ?? 0);
    });
}
