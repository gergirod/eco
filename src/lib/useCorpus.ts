"use client";

import { useEffect, useMemo, useState } from "react";
import { getInitialFallback } from "./corpus-fallbacks";
import { corpusClient } from "./corpus-client";

type CorpusMap<K extends string> = { [P in K]: unknown };

/**
 * Varios datasets en un solo batch (1× meta check + 1× fetch in.(…) a Supabase).
 */
export function useCorpus<const K extends string>(keys: readonly K[]): CorpusMap<K> {
  const keySig = useMemo(() => keys.join("\0"), [keys]);

  const [data, setData] = useState<CorpusMap<K>>(() => {
    const init = {} as CorpusMap<K>;
    for (const key of keys) {
      init[key] = corpusClient.getCached(key, getInitialFallback(key));
    }
    return init;
  });

  useEffect(() => {
    const parsed = keySig.split("\0") as K[];
    corpusClient.primeLocalFallbacks(parsed);

    const unsubs = parsed.map((key) =>
      corpusClient.subscribe(key, (value) => {
        setData((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
      })
    );

    corpusClient.requestKeys(parsed);
    return () => unsubs.forEach((u) => u());
  }, [keySig]);

  return data;
}
