/**
 * Fallbacks del corpus: chicos síncronos (first paint) + blobs grandes lazy (code-split).
 */

import metaSync from "@/data/meta.json";
import channelsSync from "@/data/channels.json";
import audienceSync from "@/data/audience.json";
import benchmarkSync from "@/data/benchmark.json";

/** Bundled en el chunk principal — usados en casi todas las rutas. */
const SYNC: Record<string, unknown> = {
  meta: metaSync,
  channels: channelsSync,
  audience: audienceSync,
  benchmark: benchmarkSync,
};

/** Code-split — no inflan el JS inicial de cada página. */
const LAZY: Record<string, () => Promise<unknown>> = {
  brands: () => import("@/data/brands.json").then((m) => m.default),
  reports: () => import("@/data/reports.json").then((m) => m.default),
  moments: () => import("@/data/moments.json").then((m) => m.default),
  radar: () => import("@/data/radar.json").then((m) => m.default),
  products: () => import("@/data/products.json").then((m) => m.default),
  placement: () => import("@/data/placement.json").then((m) => m.default),
  program_topics: () => import("@/data/program_topics.json").then((m) => m.default),
  program_utility: () => import("@/data/program_utility.json").then((m) => m.default),
  chat_demand: () => import("@/data/chat_demand.json").then((m) => m.default),
  chat_insights: () => import("@/data/chat_insights.json").then((m) => m.default),
  commercial_demand: () => import("@/data/commercial_demand.json").then((m) => m.default),
  commercial_demand_history: () =>
    import("@/data/commercial_demand_history.json").then((m) => m.default),
  schedule_insights: () => import("@/data/schedule_insights.json").then((m) => m.default),
  capture_schedules: () => import("@/data/capture_schedules.json").then((m) => m.default),
  sala_signals: () => import("@/data/sala_signals.json").then((m) => m.default),
  brand_history: () => import("@/data/brand_history.json").then((m) => m.default),
};

export const CORPUS_EMPTY: Record<string, unknown> = {
  meta: {},
  channels: [],
  audience: [],
  benchmark: [],
  brands: [],
  reports: {},
  moments: {},
  radar: [],
  products: [],
  placement: {},
  program_topics: { by_video: {} },
  program_utility: { programs: [], by_channel: [] },
  chat_demand: {},
  chat_insights: {},
  commercial_demand: {},
  commercial_demand_history: { snapshots: [] },
  schedule_insights: {},
  capture_schedules: {},
  sala_signals: { signals: [] },
  brand_history: { brands: {} },
};

const lazyCache = new Map<string, Promise<unknown>>();

export function bundleExportedAt(): number {
  return Date.parse((metaSync as { exported_at?: string }).exported_at || "") || 0;
}

export function getSyncFallback(key: string): unknown | undefined {
  return SYNC[key];
}

export function getEmptyFallback(key: string): unknown {
  if (key in CORPUS_EMPTY) return CORPUS_EMPTY[key];
  return null;
}

export function getInitialFallback(key: string, explicit?: unknown): unknown {
  if (explicit !== undefined) return explicit;
  const sync = getSyncFallback(key);
  if (sync !== undefined) return sync;
  return getEmptyFallback(key);
}

export function loadCorpusFallback(key: string): Promise<unknown> {
  const sync = getSyncFallback(key);
  if (sync !== undefined) return Promise.resolve(sync);
  const cached = lazyCache.get(key);
  if (cached) return cached;
  const loader = LAZY[key];
  const promise = loader
    ? loader()
    : Promise.resolve(getEmptyFallback(key));
  lazyCache.set(key, promise);
  return promise;
}
