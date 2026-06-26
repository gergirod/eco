import brandsFile from "@/data/brands.json";

export type BrandOption = {
  slug: string;
  name: string;
  mentions: number;
  channels: string[];
};

const brands: BrandOption[] = (brandsFile as BrandOption[])
  .map((b) => ({
    slug: b.slug,
    name: b.name,
    mentions: b.mentions ?? 0,
    channels: b.channels ?? [],
  }))
  .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name, "es"));

export function listBrandOptions(): BrandOption[] {
  return brands;
}

export function brandOptionLabel(b: BrandOption): string {
  const ch = b.channels.length ? ` · ${b.channels.join(", ")}` : "";
  return `${b.name} (${b.mentions} menciones${ch})`;
}

export type BrandPair = {
  brandSlug: string;
  competitorSlug: string;
};

export function pairsToPartnerPayload(pairs: BrandPair[]): {
  brand_slugs: string[];
  competitor_by_brand: Record<string, string>;
} {
  const brand_slugs: string[] = [];
  const competitor_by_brand: Record<string, string> = {};

  for (const pair of pairs) {
    if (!pair.brandSlug) continue;
    if (!brand_slugs.includes(pair.brandSlug)) brand_slugs.push(pair.brandSlug);
    if (pair.competitorSlug) {
      competitor_by_brand[pair.brandSlug] = pair.competitorSlug;
    }
  }

  return { brand_slugs, competitor_by_brand };
}

export function emptyBrandPair(): BrandPair {
  return { brandSlug: "", competitorSlug: "" };
}
