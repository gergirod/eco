/**
 * Cliente único del corpus: 1 check de meta + batch fetch por tick de React.
 */

import {
  bundleExportedAt,
  getInitialFallback,
  getSyncFallback,
  loadCorpusFallback,
} from "./corpus-fallbacks";
import { fetchDatasets, supabaseEnabled } from "./supabase";

type Listener = (value: unknown) => void;

let remoteFresh: boolean | null = null;
let freshnessPromise: Promise<boolean> | null = null;

const cache = new Map<string, unknown>();
const localFallback = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

let pendingKeys = new Set<string>();
let batchScheduled = false;

function notify(key: string, value: unknown) {
  cache.set(key, value);
  listeners.get(key)?.forEach((fn) => fn(value));
}

function subscribe(key: string, listener: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  if (cache.has(key)) listener(cache.get(key));
  return () => listeners.get(key)?.delete(listener);
}

function setLocalFallback(key: string, value: unknown) {
  localFallback.set(key, value);
  if (remoteFresh === false || !supabaseEnabled) notify(key, value);
}

async function shouldUseRemote(): Promise<boolean> {
  if (!supabaseEnabled) {
    remoteFresh = false;
    return false;
  }
  if (remoteFresh !== null) return remoteFresh;

  if (!freshnessPromise) {
    freshnessPromise = (async () => {
      const batch = await fetchDatasets(["meta"]);
      const remoteMeta = batch.meta as { exported_at?: string; n_pauta_mentions?: number } | undefined;
      if (!remoteMeta) {
        remoteFresh = false;
        return false;
      }

      cache.set("meta", remoteMeta);
      notify("meta", remoteMeta);

      const remoteTs = Date.parse(remoteMeta.exported_at || "") || 0;
      const bundleHasSchema = (getInitialFallback("meta") as { n_pauta_mentions?: number })
        .n_pauta_mentions != null;
      const remoteHasSchema = remoteMeta.n_pauta_mentions != null;

      if (remoteTs <= bundleExportedAt()) {
        remoteFresh = false;
        return false;
      }
      if (bundleHasSchema && !remoteHasSchema) {
        remoteFresh = false;
        return false;
      }

      remoteFresh = true;
      return true;
    })();
  }

  return freshnessPromise;
}

function flushBatch() {
  batchScheduled = false;
  const keys = [...pendingKeys];
  pendingKeys = new Set();
  if (!keys.length) return;

  void (async () => {
    const useRemote = await shouldUseRemote();
    if (!useRemote) {
      for (const key of keys) {
        if (cache.has(key)) continue;
        const fb =
          localFallback.get(key) ??
          (await loadCorpusFallback(key).catch(() => getInitialFallback(key)));
        notify(key, fb);
      }
      return;
    }

    const missing = keys.filter((k) => k !== "meta" && !cache.has(k));
    if (missing.length) {
      const fetched = await fetchDatasets(missing);
      for (const key of missing) {
        const value =
          fetched[key] ??
          localFallback.get(key) ??
          (await loadCorpusFallback(key).catch(() => getInitialFallback(key)));
        notify(key, value);
      }
    }

    for (const key of keys) {
      if (!cache.has(key)) {
        const fb =
          localFallback.get(key) ??
          (await loadCorpusFallback(key).catch(() => getInitialFallback(key)));
        notify(key, fb);
      }
    }
  })();
}

function requestKeys(keys: string[], explicitFallback?: unknown) {
  for (const key of keys) {
    if (explicitFallback !== undefined) setLocalFallback(key, explicitFallback);
    if (!cache.has(key)) {
      const initial = getInitialFallback(key, explicitFallback);
      cache.set(key, initial);
    }
    pendingKeys.add(key);
  }

  if (!batchScheduled) {
    batchScheduled = true;
    queueMicrotask(flushBatch);
  }
}

function primeLocalFallbacks(keys: string[]) {
  for (const key of keys) {
    if (getSyncFallback(key) !== undefined) continue;
    if (localFallback.has(key)) continue;
    void loadCorpusFallback(key).then((fb) => setLocalFallback(key, fb));
  }
}

export const corpusClient = {
  subscribe,
  requestKeys,
  primeLocalFallbacks,
  getCached<T>(key: string, fallback?: T): T {
    return (cache.get(key) ?? getInitialFallback(key, fallback)) as T;
  },
};
