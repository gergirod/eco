/** Configuración de design partners (sin secretos — passwords en ECO_PARTNER_PASSWORDS). */

export const PARTNER_ICPS = ["agencia", "marca", "canal"] as const;
export type PartnerIcp = (typeof PARTNER_ICPS)[number];

export const PARTNER_PLANS = [
  "brand_starter",
  "portfolio",
  "portfolio_pro",
  "channel",
] as const;
export type PartnerPlan = (typeof PARTNER_PLANS)[number];

/** Límites por plan — MARKET-002 / SPEC-010 */
export const PLAN_MAX_BRANDS: Record<PartnerPlan, number> = {
  brand_starter: 1,
  portfolio: 3,
  portfolio_pro: 5,
  channel: 0,
};

export const ICP_DEFAULT_PLAN: Record<PartnerIcp, PartnerPlan> = {
  agencia: "portfolio",
  marca: "brand_starter",
  canal: "channel",
};

export const PLAN_LABELS: Record<PartnerPlan, string> = {
  brand_starter: "ECO Brand",
  portfolio: "ECO Portfolio",
  portfolio_pro: "ECO Portfolio Pro",
  channel: "ECO Channel",
};

export const ICP_LABELS: Record<PartnerIcp, string> = {
  agencia: "Agencia",
  marca: "Marca",
  canal: "Canal",
};

const PLAN_ALLOWED_ICP: Record<PartnerPlan, PartnerIcp[]> = {
  brand_starter: ["marca"],
  portfolio: ["agencia"],
  portfolio_pro: ["agencia"],
  channel: ["canal"],
};

export function plansForIcp(icp: PartnerIcp): PartnerPlan[] {
  return PARTNER_PLANS.filter((plan) => PLAN_ALLOWED_ICP[plan].includes(icp));
}

export function normalizePartnerIcp(value: unknown): PartnerIcp {
  if (typeof value === "string" && PARTNER_ICPS.includes(value as PartnerIcp)) {
    return value as PartnerIcp;
  }
  return "agencia";
}

export function normalizePartnerPlan(
  value: unknown,
  icp: PartnerIcp = "agencia"
): PartnerPlan {
  if (typeof value === "string" && PARTNER_PLANS.includes(value as PartnerPlan)) {
    const plan = value as PartnerPlan;
    if (PLAN_ALLOWED_ICP[plan].includes(icp)) return plan;
  }
  return ICP_DEFAULT_PLAN[icp];
}

export type PartnerRecord = {
  /** id estable — usado en login y env de contraseña */
  id: string;
  name: string;
  /** agencia · marca · canal — SPEC-010 */
  icp?: PartnerIcp;
  /** brand_starter · portfolio · portfolio_pro · channel */
  plan?: PartnerPlan;
  /** Marcas del portfolio del partner (monitoreo principal) */
  brand_slugs: string[];
  /**
   * Competidores de referencia — **máx. 1 por marca** (`brand_slugs.length`).
   * Preferir `competitor_by_brand` para dejar explícito el par.
   */
  competitor_slugs: string[];
  /** Marca slug → competidor slug (1:1) */
  competitor_by_brand?: Record<string, string>;
  /** ICP canal — canal(es) propios */
  channel_ids?: string[];
  /** ICP canal — canales para benchmark */
  benchmark_channel_ids?: string[];
  /** false = deshabilitado sin borrar del archivo */
  active?: boolean;
  contact_email?: string;
  notes?: string;
  price_ars_month?: number;
  contract_started_at?: string;
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

export function validatePartnerPlan(partner: PartnerRecord): string | null {
  const icp = normalizePartnerIcp(partner.icp);
  const plan = normalizePartnerPlan(partner.plan, icp);

  if (!PLAN_ALLOWED_ICP[plan].includes(icp)) {
    return `El plan ${PLAN_LABELS[plan]} no aplica al ICP ${ICP_LABELS[icp]}.`;
  }

  const maxBrands = PLAN_MAX_BRANDS[plan];
  if (partner.brand_slugs.length > maxBrands) {
    return `Plan ${PLAN_LABELS[plan]} permite máx. ${maxBrands} marca(s); cargaste ${partner.brand_slugs.length}.`;
  }

  if (icp === "canal") {
    const channels = partner.channel_ids || [];
    if (!channels.length) {
      return "ICP canal requiere al menos un channel_id (ej. olga).";
    }
    return null;
  }

  if (!partner.brand_slugs.length) {
    return "Indicá al menos una marca en pares marca:competidor.";
  }

  return null;
}

/** Validación completa al alta — competidores + plan + canal */
export function validatePartnerContract(partner: PartnerRecord): string | null {
  return validatePartnerCompetitors(partner) || validatePartnerPlan(partner);
}
