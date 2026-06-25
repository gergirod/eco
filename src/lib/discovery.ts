/**
 * Discovery Data Layer — frontend contract for Advertiser Discovery (SPR-005).
 * Maps SPR-004 export JSON into domain types. UI must import from here only.
 */

import type { EvidenceLevel } from "./campaign";
import brandsBundle from "@/data/brands.json";
import reportsBundle from "@/data/reports.json";
import metaBundle from "@/data/meta.json";

// ---------------------------------------------------------------------------
// Domain types (public — stable frontend contract)
// ---------------------------------------------------------------------------

export type ConfidenceTier = "high_confidence" | "emerging_confidence" | "detected";

export type DiscoveryEvidenceSummary = {
  verified: number;
  partial: number;
  insufficient: number;
};

export type DiscoveryPlatformCoverage = {
  channelsCovered: number;
  hoursCaptured: number;
  lastCapture: string;
  programsWithViewers: number;
  highConfidenceAdvertisers: number;
  emergingConfidenceAdvertisers: number;
  activationsWithVerifiedEvidence: number;
  /** Corpus programs with extraction (honest footer — read from export, not computed). */
  totalProgramsInCorpus?: number;
};

export type DiscoveryAdvertiser = {
  slug: string;
  name: string;
  channels: string[];
  channelCount: number;
  programCount: number;
  activationCount: number;
  firstSeen: string;
  lastSeen: string;
  peakConcurrentViewers: number | null;
  confidenceTier: ConfidenceTier;
  confidenceReason: string;
  evidenceSummary: DiscoveryEvidenceSummary;
};

export type DiscoveryActivation = {
  channel: string;
  channelName: string;
  date: string;
  dateIso: string;
  videoId: string;
  title: string;
  minute: string;
  tSeconds: number;
  quote: string;
  evidence: EvidenceLevel | string;
  evidenceReason: string;
  concurrentViewers: number | null;
  tier: number;
  tierLabel: string;
  sentiment: string;
  views: number | null;
  precise: boolean;
};

export type DiscoveryHighlight = {
  quote: string;
  minute: string;
  title: string;
  channel: string;
  channelName: string;
  concurrentViewers: number | null;
  evidence: EvidenceLevel | string;
  videoId: string;
};

export type DiscoveryBrowseItem = DiscoveryAdvertiser & {
  highlight: DiscoveryHighlight | null;
};

export type DiscoveryProfile = {
  advertiser: DiscoveryAdvertiser;
  activations: DiscoveryActivation[];
  highlight: DiscoveryHighlight | null;
};

export type DiscoverySortKey = "last_seen" | "peak_conc_at";

export type DiscoveryBrowseOptions = {
  /** Default: high_confidence only */
  tiers?: ConfidenceTier[];
  query?: string;
  channel?: string;
  sort?: DiscoverySortKey;
};

export type DiscoveryDataset = {
  meta: DiscoveryPlatformCoverage;
  advertisers: DiscoveryAdvertiser[];
};

export type BrandReportJoin = {
  advertiser: DiscoveryAdvertiser;
  activations: DiscoveryActivation[];
};

export const CONFIDENCE_TIER_ORDER: ConfidenceTier[] = [
  "high_confidence",
  "emerging_confidence",
  "detected",
];

export const CONFIDENCE_TIER_LABEL: Record<ConfidenceTier, string> = {
  high_confidence: "Alta confianza",
  emerging_confidence: "Señal temprana",
  detected: "Detectado",
};

export const DEFAULT_BROWSE_TIERS: ConfidenceTier[] = ["high_confidence"];

// ---------------------------------------------------------------------------
// Export JSON shapes (private — not part of the UI contract)
// ---------------------------------------------------------------------------

type ExportDiscoveryMeta = {
  channels_covered: number;
  hours_captured: number;
  last_capture: string;
  programs_with_viewers: number;
  high_confidence_advertisers: number;
  emerging_confidence_advertisers: number;
  activations_with_verified_evidence: number;
};

type ExportMetaRoot = {
  discovery?: ExportDiscoveryMeta;
  n_topics_total?: number;
};

type ExportBrandRow = {
  slug: string;
  name: string;
  kind?: string;
  channels?: string[];
  n_channels?: number;
  n_programs?: number;
  n_videos?: number;
  n_activations?: number;
  mentions?: number;
  first_seen?: string;
  last_seen?: string;
  peak_conc_at?: number | null;
  confidence_tier?: string;
  confidence_reason?: string;
  evidence_summary?: {
    verified?: number;
    partial?: number;
    insufficient?: number;
  };
};

const activationIndex = new WeakMap<DiscoveryDataset, Record<string, DiscoveryActivation[]>>();

function indexActivations(
  dataset: DiscoveryDataset,
  activationsBySlug: Record<string, DiscoveryActivation[]>
): void {
  activationIndex.set(dataset, activationsBySlug);
}

function getIndexedActivations(dataset: DiscoveryDataset, slug: string): DiscoveryActivation[] {
  return activationIndex.get(dataset)?.[slug] ?? [];
}

type ExportActivationRow = {
  channel?: string;
  channel_name?: string;
  date?: string;
  date_iso?: string;
  video_id?: string;
  title?: string;
  minute?: string;
  t_seconds?: number;
  quote?: string;
  evidence?: string;
  evidence_reason?: string;
  conc_at?: number | null;
  tier?: number;
  tier_label?: string;
  sentiment?: string;
  views?: number;
  precise?: boolean;
};

type ExportBrandReport = {
  kind?: string;
  detail?: ExportActivationRow[];
};

// ---------------------------------------------------------------------------
// Mapping (export → domain)
// ---------------------------------------------------------------------------

function asConfidenceTier(value: string | undefined): ConfidenceTier {
  if (value === "high_confidence" || value === "emerging_confidence" || value === "detected") {
    return value;
  }
  return "detected";
}

function mapEvidenceSummary(raw: ExportBrandRow["evidence_summary"]): DiscoveryEvidenceSummary {
  return {
    verified: raw?.verified ?? 0,
    partial: raw?.partial ?? 0,
    insufficient: raw?.insufficient ?? 0,
  };
}

function mapPlatformCoverage(metaRoot: ExportMetaRoot): DiscoveryPlatformCoverage {
  const d = metaRoot.discovery;
  if (!d) {
    return {
      channelsCovered: 0,
      hoursCaptured: 0,
      lastCapture: "",
      programsWithViewers: 0,
      highConfidenceAdvertisers: 0,
      emergingConfidenceAdvertisers: 0,
      activationsWithVerifiedEvidence: 0,
    };
  }
  return {
    channelsCovered: d.channels_covered,
    hoursCaptured: d.hours_captured,
    lastCapture: d.last_capture,
    programsWithViewers: d.programs_with_viewers,
    highConfidenceAdvertisers: d.high_confidence_advertisers,
    emergingConfidenceAdvertisers: d.emerging_confidence_advertisers,
    activationsWithVerifiedEvidence: d.activations_with_verified_evidence,
    totalProgramsInCorpus: metaRoot.n_topics_total,
  };
}

function mapAdvertiser(row: ExportBrandRow): DiscoveryAdvertiser | null {
  if (row.kind && row.kind !== "marca") return null;
  if (!row.slug || !row.name) return null;

  return {
    slug: row.slug,
    name: row.name,
    channels: row.channels ?? [],
    channelCount: row.n_channels ?? row.channels?.length ?? 0,
    programCount: row.n_programs ?? row.n_videos ?? 0,
    activationCount: row.n_activations ?? row.mentions ?? 0,
    firstSeen: row.first_seen ?? "",
    lastSeen: row.last_seen ?? "",
    peakConcurrentViewers:
      row.peak_conc_at != null && row.peak_conc_at > 0 ? row.peak_conc_at : null,
    confidenceTier: asConfidenceTier(row.confidence_tier),
    confidenceReason: row.confidence_reason ?? "",
    evidenceSummary: mapEvidenceSummary(row.evidence_summary),
  };
}

function mapActivation(row: ExportActivationRow): DiscoveryActivation {
  return {
    channel: row.channel ?? "",
    channelName: row.channel_name ?? row.channel ?? "",
    date: row.date ?? "",
    dateIso: row.date_iso ?? "",
    videoId: row.video_id ?? "",
    title: row.title ?? "",
    minute: row.minute ?? "",
    tSeconds: row.t_seconds ?? 0,
    quote: row.quote ?? "",
    evidence: row.evidence ?? "",
    evidenceReason: row.evidence_reason ?? "",
    concurrentViewers:
      row.conc_at != null && row.conc_at > 0 ? row.conc_at : null,
    tier: row.tier ?? 0,
    tierLabel: row.tier_label ?? "",
    sentiment: row.sentiment ?? "",
    views: row.views ?? null,
    precise: row.precise ?? false,
  };
}

function mapHighlight(activation: DiscoveryActivation): DiscoveryHighlight | null {
  if (!activation.quote.trim()) return null;
  return {
    quote: activation.quote,
    minute: activation.minute,
    title: activation.title,
    channel: activation.channel,
    channelName: activation.channelName,
    concurrentViewers: activation.concurrentViewers,
    evidence: activation.evidence,
    videoId: activation.videoId,
  };
}

function parseDisplayDate(value: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return 0;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function activationsForSlug(
  slug: string,
  reports: Record<string, ExportBrandReport>
): DiscoveryActivation[] {
  const report = reports[slug];
  if (!report || report.kind !== "marca") return [];
  return (report.detail ?? []).map(mapActivation);
}

// ---------------------------------------------------------------------------
// Dataset construction
// ---------------------------------------------------------------------------

export function createDiscoveryDataset(
  brands: unknown,
  reports: unknown,
  meta: unknown
): DiscoveryDataset {
  const brandRows = brands as ExportBrandRow[];
  const reportMap = reports as Record<string, ExportBrandReport>;
  const metaRoot = meta as ExportMetaRoot;

  const advertisers = brandRows
    .map(mapAdvertiser)
    .filter((a): a is DiscoveryAdvertiser => a != null);

  const activationsBySlug: Record<string, DiscoveryActivation[]> = {};
  for (const adv of advertisers) {
    activationsBySlug[adv.slug] = activationsForSlug(adv.slug, reportMap);
  }

  const dataset: DiscoveryDataset = {
    meta: mapPlatformCoverage(metaRoot),
    advertisers,
  };
  indexActivations(dataset, activationsBySlug);
  return dataset;
}

/** Bundled export JSON (SPR-004 contract). */
export function loadDiscoveryDataset(): DiscoveryDataset {
  return createDiscoveryDataset(brandsBundle, reportsBundle, metaBundle);
}

// ---------------------------------------------------------------------------
// Join & profile
// ---------------------------------------------------------------------------

export function joinBrandReport(
  slug: string,
  dataset: DiscoveryDataset
): BrandReportJoin | null {
  const advertiser = dataset.advertisers.find((a) => a.slug === slug);
  if (!advertiser) return null;
  const activations = getIndexedActivations(dataset, slug);
  return { advertiser, activations };
}

export function getAdvertiserProfile(
  slug: string,
  dataset: DiscoveryDataset = loadDiscoveryDataset()
): DiscoveryProfile | null {
  const joined = joinBrandReport(slug, dataset);
  if (!joined) return null;
  const highlight = pickHighlightActivation(joined.activations);
  return {
    advertiser: joined.advertiser,
    activations: joined.activations,
    highlight,
  };
}

// ---------------------------------------------------------------------------
// Browse helpers (pure — read exported fields only)
// ---------------------------------------------------------------------------

export function pickHighlightActivation(
  activations: DiscoveryActivation[]
): DiscoveryHighlight | null {
  if (!activations.length) return null;

  const withQuote = activations.filter((a) => a.quote.trim().length > 0);
  const pool = withQuote.length ? withQuote : activations;

  const byConc = [...pool].sort(
    (a, b) => (b.concurrentViewers ?? 0) - (a.concurrentViewers ?? 0)
  );
  const top = byConc[0];
  return mapHighlight(top);
}

export function filterByTier(
  advertisers: DiscoveryAdvertiser[],
  tiers: ConfidenceTier[]
): DiscoveryAdvertiser[] {
  if (!tiers.length) return advertisers;
  const allowed = new Set(tiers);
  return advertisers.filter((a) => allowed.has(a.confidenceTier));
}

export function searchAdvertisers(
  advertisers: DiscoveryAdvertiser[],
  query: string
): DiscoveryAdvertiser[] {
  const q = query.trim().toLowerCase();
  if (!q) return advertisers;
  return advertisers.filter(
    (a) => a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
  );
}

export function filterByChannel(
  advertisers: DiscoveryAdvertiser[],
  channel: string
): DiscoveryAdvertiser[] {
  const ch = channel.trim().toLowerCase();
  if (!ch) return advertisers;
  return advertisers.filter((a) =>
    a.channels.some((c) => c.toLowerCase() === ch)
  );
}

export function sortBrowse(
  advertisers: DiscoveryAdvertiser[],
  sort: DiscoverySortKey = "last_seen"
): DiscoveryAdvertiser[] {
  const copy = [...advertisers];
  if (sort === "peak_conc_at") {
    copy.sort(
      (a, b) => (b.peakConcurrentViewers ?? 0) - (a.peakConcurrentViewers ?? 0)
    );
    return copy;
  }
  copy.sort((a, b) => parseDisplayDate(b.lastSeen) - parseDisplayDate(a.lastSeen));
  return copy;
}

export function toBrowseItem(
  advertiser: DiscoveryAdvertiser,
  activations: DiscoveryActivation[]
): DiscoveryBrowseItem {
  return {
    ...advertiser,
    highlight: pickHighlightActivation(activations),
  };
}

export function browseAdvertisers(
  dataset: DiscoveryDataset,
  options: DiscoveryBrowseOptions = {}
): DiscoveryBrowseItem[] {
  const tiers = options.tiers ?? DEFAULT_BROWSE_TIERS;
  let rows = filterByTier(dataset.advertisers, tiers);
  if (options.query) rows = searchAdvertisers(rows, options.query);
  if (options.channel) rows = filterByChannel(rows, options.channel);
  rows = sortBrowse(rows, options.sort ?? "last_seen");

  return rows.map((advertiser) =>
    toBrowseItem(advertiser, getIndexedActivations(dataset, advertiser.slug))
  );
}

export function getPlatformCoverage(dataset: DiscoveryDataset): DiscoveryPlatformCoverage {
  return dataset.meta;
}

export function countByTier(dataset: DiscoveryDataset, tier: ConfidenceTier): number {
  return dataset.advertisers.filter((a) => a.confidenceTier === tier).length;
}
