/** Configuración de design partners (sin secretos — passwords en ECO_PARTNER_PASSWORDS). */

export type PartnerRecord = {
  /** id estable — usado en login y env de contraseña */
  id: string;
  name: string;
  /** Marcas del portfolio del partner (monitoreo principal) */
  brand_slugs: string[];
  /**
   * Competidores de referencia — **máx. 1 por marca** (`brand_slugs.length`).
   * Preferir `competitor_by_brand` para dejar explícito el par.
   */
  competitor_slugs: string[];
  /** Marca slug → competidor slug (1:1) */
  competitor_by_brand?: Record<string, string>;
  /** false = deshabilitado sin borrar del archivo */
  active?: boolean;
  contact_email?: string;
  notes?: string;
};

export type PartnersFile = {
  version: number;
  partners: PartnerRecord[];
};

export function partnerBrandLabel(partner: PartnerRecord, slug: string): "marca" | "competidor" {
  return partner.brand_slugs.includes(slug) ? "marca" : "competidor";
}

export function partnerCompetitorSlugs(partner: PartnerRecord): string[] {
  if (partner.competitor_by_brand && Object.keys(partner.competitor_by_brand).length) {
    return [...new Set(Object.values(partner.competitor_by_brand))];
  }
  return partner.competitor_slugs;
}

export function validatePartnerCompetitors(partner: PartnerRecord): string | null {
  const nBrands = partner.brand_slugs.length;
  const nComp = partnerCompetitorSlugs(partner).length;
  if (nComp > nBrands) {
    return `Máx. 1 competidor por marca (${nComp} competidores, ${nBrands} marcas)`;
  }
  if (partner.competitor_by_brand) {
    for (const brand of Object.keys(partner.competitor_by_brand)) {
      if (!partner.brand_slugs.includes(brand)) {
        return `competitor_by_brand referencia marca no monitoreada: ${brand}`;
      }
    }
  }
  return null;
}
