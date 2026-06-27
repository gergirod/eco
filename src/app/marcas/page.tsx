"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CoverageLine from "@/components/CoverageLine";
import DiscoveryHero from "@/components/discovery/DiscoveryHero";
import DiscoveryHeroPreview from "@/components/discovery/DiscoveryHeroPreview";
import AdvertiserBrowse from "@/components/discovery/AdvertiserBrowse";
import PartnerMarcasHome from "@/components/partner/PartnerMarcasHome";
import { usePartner } from "@/contexts/PartnerContext";
import DiscoveryValueProp from "@/components/discovery/DiscoveryValueProp";
import { ATTENTION_DEFINITION } from "@/lib/coverage";
import {
  browseAdvertisers,
  type DiscoveryDataset,
} from "@/lib/discovery";
import { useDiscoveryDataset, usePlatformCoverage } from "@/lib/use-discovery";
import { useDataset } from "@/lib/useDataset";
import { useMemo } from "react";

const PREVIEW_COUNT = 9;
const HEADLINE_BRAND_COUNT = 3;
const PINNED_PREVIEW_SLUG = "iol-inversiones";

function buildPreviewItems(dataset: DiscoveryDataset) {
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
  items: ReturnType<typeof buildPreviewItems>,
  chName: Record<string, string>
): string {
  const ids = new Set<string>();
  for (const item of items) {
    item.channels.forEach((c) => ids.add(c));
  }
  const names = [...ids].map((id) => chName[id] || id);
  if (!names.length) return "Olga, Luzu y Blender";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function MarcasPublicContent() {
  const dataset = useDiscoveryDataset();
  const channels = useDataset("channels") as { id: string; name: string }[];
  const CH_NAME = useMemo(
    () => Object.fromEntries(channels.map((c) => [c.id, c.name])),
    [channels]
  );
  const coverage = usePlatformCoverage();
  const previewItems = useMemo(() => buildPreviewItems(dataset), [dataset]);
  const previewSlugs = useMemo(() => previewItems.map((item) => item.slug), [previewItems]);

  const headline = useMemo(() => {
    const shortNames = previewItems.slice(0, HEADLINE_BRAND_COUNT).map((item) => {
      if (item.slug === "iol-inversiones") return "IOL";
      return item.name.split(" ")[0];
    });
    const brands = brandTeaserFromNames(shortNames);
    const channels = channelTeaserFromPreview(previewItems, CH_NAME);
    if (brands) {
      return `${brands} pautaron en ${channels} — con cita y minuto.`;
    }
    return `Marcas con pauta verificable en ${channels}.`;
  }, [previewItems, CH_NAME]);

  return (
    <div className="max-w-6xl pb-8">
      <DiscoveryHero headline={headline} />
      <DiscoveryValueProp />
      <p className="text-[12px] text-gray-400 mb-6 leading-relaxed max-w-3xl">{ATTENTION_DEFINITION}</p>
      <CoverageLine coverage={coverage} />
      <DiscoveryHeroPreview items={previewItems} />
      <AdvertiserBrowse dataset={dataset} excludeSlugs={previewSlugs} />
    </div>
  );
}

function MarcasPageInner() {
  const { loading, isScoped, partner } = usePartner();
  const searchParams = useSearchParams();
  const scopeErr = searchParams.get("err") === "scope";

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  if (isScoped && partner) {
    return (
      <>
        {scopeErr && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-[13px] text-red-700 border border-red-100">
            Esa marca no está en tu contrato. Elegí una de tus marcas abajo.
          </div>
        )}
        <PartnerMarcasHome
          brandSlugs={partner.brand_slugs}
          competitorSlugs={partner.competitor_slugs}
          partnerName={partner.name}
        />
      </>
    );
  }

  return <MarcasPublicContent />;
}

export default function MarcasPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400 py-8">Cargando…</div>}>
      <MarcasPageInner />
    </Suspense>
  );
}
