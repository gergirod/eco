/** Demo design partner — config fija, sin auth. Ver /agencia */

export type AgenciaBrandPair = {
  slug: string;
  rubro: string;
  competitorSlug: string | null;
};

export const AGENCIA_DEMO = {
  id: "demo-agencia",
  name: "Media Norte",
  tagline: "Agencia boutique · design partner",
  brandSlugs: ["wanderlust", "iol-inversiones"] as const,
  competitorSlugs: ["aerolineas-argentina", "mercado-pago"] as const,
  pairs: [
    { slug: "wanderlust", rubro: "viajes", competitorSlug: "aerolineas-argentina" },
    { slug: "iol-inversiones", rubro: "fintech", competitorSlug: "mercado-pago" },
  ] as AgenciaBrandPair[],
  rubros: ["viajes", "fintech"] as const,
} as const;

export const AGENCIA_BASE = "/agencia";

export function agenciaHref(path: string): string {
  if (!path || path === "/") return AGENCIA_BASE;
  if (path.startsWith(AGENCIA_BASE)) return path;
  return `${AGENCIA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
