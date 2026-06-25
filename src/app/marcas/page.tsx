"use client";

import { Suspense, useMemo } from "react";
import CoverageLine from "@/components/CoverageLine";
import DiscoveryHero from "@/components/discovery/DiscoveryHero";
import DiscoveryHeroPreview from "@/components/discovery/DiscoveryHeroPreview";
import AdvertiserBrowse from "@/components/discovery/AdvertiserBrowse";
import {
  browseAdvertisers,
  getPlatformCoverage,
  loadDiscoveryDataset,
} from "@/lib/discovery";
import channelsBundle from "@/data/channels.json";

const PREVIEW_COUNT = 9;
const HEADLINE_BRAND_COUNT = 3;
const PINNED_PREVIEW_SLUG = "iol-inversiones";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

function buildPreviewItems(dataset: ReturnType<typeof loadDiscoveryDataset>) {
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

function channelTeaserFromPreview(
  items: ReturnType<typeof buildPreviewItems>
): string {
  const ids = new Set<string>();
  for (const item of items) {
    item.channels.forEach((c) => ids.add(c));
  }
  const names = [...ids].map((id) => CH_NAME[id] || id);
  if (!names.length) return "Olga, Luzu y Blender";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function MarcasContent() {
  const dataset = useMemo(() => loadDiscoveryDataset(), []);
  const coverage = useMemo(() => getPlatformCoverage(dataset), [dataset]);
  const previewItems = useMemo(() => buildPreviewItems(dataset), [dataset]);
  const previewSlugs = useMemo(() => previewItems.map((item) => item.slug), [previewItems]);

  const headline = useMemo(() => {
    const shortNames = previewItems.slice(0, HEADLINE_BRAND_COUNT).map((item) => {
      if (item.slug === "iol-inversiones") return "IOL";
      return item.name.split(" ")[0];
    });
    const brands = brandTeaserFromNames(shortNames);
    const channels = channelTeaserFromPreview(previewItems);
    if (brands) {
      return `${brands} pautaron en ${channels} — con cita y minuto.`;
    }
    return `Marcas con pauta verificable en ${channels}.`;
  }, [previewItems]);

  return (
    <div className="max-w-6xl pb-8">
      <DiscoveryHero headline={headline} />
      <CoverageLine coverage={coverage} />
      <DiscoveryHeroPreview items={previewItems} />
      <AdvertiserBrowse dataset={dataset} excludeSlugs={previewSlugs} />
    </div>
  );
}

export default function MarcasPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400 py-8">Cargando…</div>}>
      <MarcasContent />
    </Suspense>
  );
}
