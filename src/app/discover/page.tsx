"use client";

import { Suspense, useMemo } from "react";
import DiscoveryHero from "@/components/discovery/DiscoveryHero";
import DiscoveryHeroPreview from "@/components/discovery/DiscoveryHeroPreview";
import DiscoveryValueProp from "@/components/discovery/DiscoveryValueProp";
import DiscoveryProductFunnel from "@/components/discovery/DiscoveryProductFunnel";
import DiscoveryCoverage from "@/components/discovery/DiscoveryCoverage";
import AdvertiserBrowse from "@/components/discovery/AdvertiserBrowse";
import {
  browseAdvertisers,
  getPlatformCoverage,
  loadDiscoveryDataset,
} from "@/lib/discovery";

const PREVIEW_COUNT = 3;
const PINNED_PREVIEW_SLUG = "iol-inversiones";

function buildPreviewItems(
  dataset: ReturnType<typeof loadDiscoveryDataset>
) {
  const all = browseAdvertisers(dataset, {
    tiers: ["high_confidence"],
    sort: "peak_conc_at",
  });
  const pinned = all.find((item) => item.slug === PINNED_PREVIEW_SLUG);
  const rest = all.filter((item) => item.slug !== PINNED_PREVIEW_SLUG);
  if (pinned) {
    return [pinned, ...rest].slice(0, PREVIEW_COUNT);
  }
  return all.slice(0, PREVIEW_COUNT);
}

function brandTeaserFromNames(names: string[]): string {
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function DiscoverContent() {
  const dataset = useMemo(() => loadDiscoveryDataset(), []);
  const coverage = useMemo(() => getPlatformCoverage(dataset), [dataset]);

  const previewItems = useMemo(() => buildPreviewItems(dataset), [dataset]);

  const previewSlugs = useMemo(
    () => previewItems.map((item) => item.slug),
    [previewItems]
  );

  const brandTeaser = useMemo(() => {
    const shortNames = previewItems.map((item) => {
      if (item.slug === "iol-inversiones") return "IOL";
      const first = item.name.split(" ")[0];
      return first;
    });
    return brandTeaserFromNames(shortNames);
  }, [previewItems]);

  return (
    <div className="max-w-6xl pb-8">
      <DiscoveryHero brandTeaser={brandTeaser} />
      <DiscoveryHeroPreview items={previewItems} />
      <DiscoveryValueProp />
      <AdvertiserBrowse dataset={dataset} excludeSlugs={previewSlugs} />
      <DiscoveryProductFunnel />
      <DiscoveryCoverage coverage={coverage} />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={<div className="text-[13px] text-gray-400 py-8">Cargando…</div>}
    >
      <DiscoverContent />
    </Suspense>
  );
}
