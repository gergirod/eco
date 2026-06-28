"use client";

import { useMemo, useEffect, useState } from "react";
import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { loadLocalAgenciaSetup } from "@/lib/agencia-setup-storage";
import { usePartner } from "@/contexts/PartnerContext";
import placementFile from "@/data/placement.json";

const BRAND_RUBROS = (placementFile as { brand_rubros?: Record<string, string> }).brand_rubros ?? {};

export type AgenciaConfig = {
  id: string;
  name: string;
  brandSlugs: string[];
  competitorSlugs: string[];
  pairs: AgenciaBrandPair[];
  rubros: string[];
  /** true = preview interno (Media Norte fija). false = cliente real. */
  isPreview: boolean;
};

function pairsFromSlugs(
  brandSlugs: string[],
  competitorSlugs: string[],
  competitorByBrand?: Record<string, string>
): AgenciaBrandPair[] {
  return brandSlugs.map((slug) => ({
    slug,
    rubro: BRAND_RUBROS[slug] || "otro",
    competitorSlug: competitorByBrand?.[slug] ?? null,
  }));
}

/** Config del producto agencia: partner logueado, setup local, o demo interna. */
export function useAgenciaConfig(): { loading: boolean; config: AgenciaConfig } {
  const { loading, isScoped, partner } = usePartner();
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    const onStorage = () => setLocalVersion((v) => v + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("eco-agencia-setup", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("eco-agencia-setup", onStorage);
    };
  }, []);

  const config = useMemo((): AgenciaConfig => {
    if (isScoped && partner) {
      const pairs = pairsFromSlugs(
        partner.brand_slugs,
        partner.competitor_slugs,
        partner.competitor_by_brand
      );
      const rubros = [...new Set(pairs.map((p) => p.rubro))];
      return {
        id: partner.id,
        name: partner.name,
        brandSlugs: partner.brand_slugs,
        competitorSlugs: partner.competitor_slugs,
        pairs,
        rubros,
        isPreview: false,
      };
    }

    const local = loadLocalAgenciaSetup();
    if (local?.brandSlugs.length) {
      return {
        id: "local-trial",
        name: local.name || "Mi agencia",
        brandSlugs: local.brandSlugs,
        competitorSlugs: local.competitorSlugs,
        pairs: local.pairs,
        rubros: [...new Set(local.pairs.map((p) => p.rubro))],
        isPreview: false,
      };
    }

    return {
      id: "preview-empty",
      name: "Mi agencia",
      brandSlugs: [],
      competitorSlugs: [],
      pairs: [],
      rubros: [],
      isPreview: true,
    };
  }, [isScoped, partner, localVersion]);

  return { loading, config };
}
