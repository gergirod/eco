"use client";

import { useEffect, useState } from "react";
import { getInitialFallback } from "./corpus-fallbacks";
import { corpusClient } from "./corpus-client";

/**
 * Un dataset del corpus. Comparte 1 check de meta y batch fetch con otros hooks del mismo render.
 * Fallback: explícito > sync bundled (meta/channels/…) > empty > lazy chunk.
 */
export function useDataset<T>(key: string, fallback?: T): T {
  const [data, setData] = useState<T>(() =>
    corpusClient.getCached(key, fallback ?? (getInitialFallback(key) as T))
  );

  useEffect(() => {
    corpusClient.primeLocalFallbacks([key]);
    const unsub = corpusClient.subscribe(key, (value) => setData(value as T));
    corpusClient.requestKeys([key], fallback);
    return unsub;
  }, [key]);

  return data;
}
