"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { loadLocalAgenciaSetup, saveLocalAgenciaSetup, notifyAgenciaSetupChanged } from "@/lib/agencia-setup-storage";
import { useAgenciaConfig } from "@/lib/use-agencia-config";

function resolveActiveSlug(brandSlugs: string[], stored?: string): string | null {
  if (!brandSlugs.length) return null;
  if (stored && brandSlugs.includes(stored)) return stored;
  return brandSlugs[0];
}

/** Marca en foco — una historia a la vez, rival opcional. */
export function useActiveBrand(): {
  loading: boolean;
  config: ReturnType<typeof useAgenciaConfig>["config"];
  activeSlug: string | null;
  activePair: AgenciaBrandPair | null;
  setActiveBrand: (slug: string) => void;
  hasRival: boolean;
} {
  const { loading, config } = useAgenciaConfig();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((v) => v + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("eco-agencia-setup", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("eco-agencia-setup", bump);
    };
  }, []);

  const activeSlug = useMemo(() => {
    void tick;
    const local = loadLocalAgenciaSetup();
    return resolveActiveSlug(config.brandSlugs, local?.activeBrandSlug);
  }, [config.brandSlugs, tick]);

  const activePair = useMemo(
    () => config.pairs.find((p) => p.slug === activeSlug) ?? null,
    [config.pairs, activeSlug]
  );

  const setActiveBrand = useCallback(
    (slug: string) => {
      if (!config.brandSlugs.includes(slug)) return;
      const local = loadLocalAgenciaSetup();
      if (local) {
        saveLocalAgenciaSetup({ ...local, activeBrandSlug: slug });
      }
      window.dispatchEvent(new Event("eco-agencia-setup"));
      setTick((v) => v + 1);
    },
    [config.brandSlugs]
  );

  return {
    loading,
    config,
    activeSlug,
    activePair,
    setActiveBrand,
    hasRival: Boolean(activePair?.competitorSlug),
  };
}
