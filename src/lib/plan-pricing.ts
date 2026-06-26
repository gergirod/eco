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

export function applyDiscount(base: number, discountPercent: number): number {
  const pct = Math.max(0, Math.min(100, discountPercent));
  return Math.round(base * (1 - pct / 100));
}

/** Atajos opcionales en UI — el operador puede escribir cualquier % (0–100). */
export const DISCOUNT_QUICK_PICKS = [0, 25, 50, 75, 100] as const;

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function planPriceSummary(plan: PartnerPlan): string {
  const g = PLAN_PRICE_GUIDES[plan];
  return `${PLAN_LABELS[plan]} — ARS ${formatArs(g.arsMin)}–${formatArs(g.arsMax)} (${g.usdHint})`;
}

/** Placeholder hasta integrar MP Preferences API — usa el monto final acordado. */
export function mercadoPagoCheckoutHint(opts: {
  amountArs: number;
  title: string;
  clientId?: string;
}): string {
  const base =
    process.env.NEXT_PUBLIC_MP_CHECKOUT_URL?.trim() ||
    "https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/overview";
  return `${base} · monto: ARS ${formatArs(opts.amountArs)} · ${opts.title}${opts.clientId ? ` (${opts.clientId})` : ""}`;
}
