import type { AgenciaBrandPair } from "@/lib/agencia-demo";

export type BrandRole = "cliente" | "competidor" | "rubro";

export function brandRole(
  slug: string,
  brandSlugs: string[],
  competitorSlugs: string[]
): BrandRole {
  if (brandSlugs.includes(slug)) return "cliente";
  if (competitorSlugs.includes(slug)) return "competidor";
  return "rubro";
}

export function competitorForBrand(
  slug: string,
  pairs: readonly AgenciaBrandPair[]
): string | null {
  return pairs.find((p) => p.slug === slug)?.competitorSlug ?? null;
}

export function brandDisplayName(
  slug: string,
  names: Record<string, string>
): string {
  return names[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
