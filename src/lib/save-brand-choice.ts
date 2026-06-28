/** Guarda una marca (y rival opcional) como setup local de prueba. */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { saveLocalAgenciaSetup, notifyAgenciaSetupChanged } from "@/lib/agencia-setup-storage";
import placementFile from "@/data/placement.json";

const BRAND_RUBROS = (placementFile as { brand_rubros?: Record<string, string> }).brand_rubros ?? {};

export function saveBrandChoice(brandSlug: string, competitorSlug: string | null, name = "Mi agencia"): void {
  const rubro = BRAND_RUBROS[brandSlug] || "otro";
  const pair: AgenciaBrandPair = { slug: brandSlug, rubro, competitorSlug };
  const competitorSlugs = competitorSlug ? [competitorSlug] : [];

  saveLocalAgenciaSetup({
    name,
    brandSlugs: [brandSlug],
    competitorSlugs,
    pairs: [pair],
    activeBrandSlug: brandSlug,
    savedAt: new Date().toISOString(),
  });
  notifyAgenciaSetupChanged();
}
