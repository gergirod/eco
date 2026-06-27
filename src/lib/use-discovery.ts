"use client";

import { useMemo } from "react";
import {
  createDiscoveryDataset,
  platformCoverageFromMeta,
  type DiscoveryDataset,
  type DiscoveryPlatformCoverage,
} from "./discovery";
import { useCorpus } from "./useCorpus";
import { useDataset } from "./useDataset";

/** Cobertura global — 1 dataset (meta), comparte batch con otros hooks de la página. */
export function usePlatformCoverage(): DiscoveryPlatformCoverage {
  const meta = useDataset("meta");
  return useMemo(() => platformCoverageFromMeta(meta), [meta]);
}

/** Discovery completo: brands + reports + meta en un solo batch fetch. */
export function useDiscoveryDataset(): DiscoveryDataset {
  const { brands, reports, meta } = useCorpus(["brands", "reports", "meta"] as const);
  return useMemo(
    () => createDiscoveryDataset(brands, reports, meta),
    [brands, reports, meta]
  );
}
