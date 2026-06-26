import { PLAN_LABELS, type PartnerPlan } from "@/lib/partners";

export type PlanPriceGuide = {
  arsMin: number;
  arsMax: number;
  arsSuggested: number;
  usdHint: string;
  includes: string;
};

/** Referencia design partner — MARKET-002 §3.1 */
export const PLAN_PRICE_GUIDES: Record<PartnerPlan, PlanPriceGuide> = {
  brand_starter: {
    arsMin: 150_000,
    arsMax: 200_000,
    arsSuggested: 175_000,
    usdHint: "USD 100–150",
    includes: "1 marca · competidor opcional · brief semanal",
  },
  portfolio: {
    arsMin: 250_000,
    arsMax: 350_000,
    arsSuggested: 300_000,
    usdHint: "USD 150–250",
    includes: "Hasta 3 marcas · 1 comp/marca (opcional) · mercado abierto",
  },
  portfolio_pro: {
    arsMin: 400_000,
    arsMax: 500_000,
    arsSuggested: 450_000,
    usdHint: "USD 250–350",
    includes: "Hasta 5 marcas · 1 comp/marca (opcional) · mercado abierto",
  },
  channel: {
    arsMin: 400_000,
    arsMax: 600_000,
    arsSuggested: 500_000,
    usdHint: "USD 250–400",
    includes: "Canal + benchmark · certificados · novedades y tendencias",
  },
};

export function formatArs(n: number): string {
  return n.toLocaleString("es-AR");
}

export function planPriceSummary(plan: PartnerPlan): string {
  const g = PLAN_PRICE_GUIDES[plan];
  return `${PLAN_LABELS[plan]} — ARS ${formatArs(g.arsMin)}–${formatArs(g.arsMax)} (${g.usdHint})`;
}
