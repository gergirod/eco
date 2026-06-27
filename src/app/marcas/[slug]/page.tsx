"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BrandProfileSections from "@/components/discovery/brand-profile/BrandProfileSections";
import BrandProfileTabBar from "@/components/discovery/brand-profile/BrandProfileTabBar";
import CampaignDeliveryBanner from "@/components/discovery/brand-profile/CampaignDeliveryBanner";
import {
  parseBrandProfileTab,
  type BrandProfileTabId,
} from "@/components/discovery/brand-profile/tabs";
import CoverageLine from "@/components/CoverageLine";
import EntityCoverageLine from "@/components/EntityCoverageLine";
import ProfileEvidenceHero from "@/components/discovery/ProfileEvidenceHero";
import MomentModal from "@/components/MomentModal";
import { campaignReportKey, findCampaignSlugForAdvertiser } from "@/lib/campaign";
import { brandEntityCoverage } from "@/lib/coverage";
import {
  createDiscoveryDataset,
  getAdvertiserProfile,
  getPlatformCoverage,
  pickHighlightActivation,
  scopeActivationsToChannel,
  scopeAdvertiserToChannel,
  scopeBrandReportToChannel,
  type ScopedBrandReport,
} from "@/lib/discovery";
import { useDataset } from "@/lib/useDataset";
import brandsFb from "@/data/brands.json";
import channelsFb from "@/data/channels.json";
import metaFb from "@/data/meta.json";
import momentsFb from "@/data/moments.json";
import reportsFb from "@/data/reports.json";

function MarcaProfileInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const reports = useDataset<Record<string, unknown>>("reports", reportsFb as Record<string, unknown>);
  const channels = useDataset<{ id: string; name: string }[]>("channels", channelsFb as { id: string; name: string }[]);
  const moments = useDataset<Record<string, Record<string, unknown>>>(
    "moments",
    momentsFb as Record<string, Record<string, unknown>>
  );
  const brands = useDataset<unknown>("brands", brandsFb);
  const meta = useDataset<unknown>("meta", metaFb);

  const [openMention, setOpenMention] = useState<Record<string, unknown> | null>(null);
  const channelScope = (searchParams.get("channel") || "").trim().toLowerCase() || null;

  const tab = useMemo(() => {
    const parsed = parseBrandProfileTab(searchParams.get("tab"));
    if (channelScope && parsed === "canales") return "resumen" as BrandProfileTabId;
    return parsed;
  }, [searchParams, channelScope]);

  const dataset = useMemo(
    () => createDiscoveryDataset(brands, reports, meta),
    [brands, reports, meta]
  );

  const coverage = useMemo(() => getPlatformCoverage(dataset), [dataset]);

  const baseProfile = useMemo(() => getAdvertiserProfile(slug, dataset), [slug, dataset]);

  const profile = useMemo(() => {
    if (!baseProfile || !channelScope) return baseProfile;
    const activations = scopeActivationsToChannel(baseProfile.activations, channelScope);
    const advertiser = scopeAdvertiserToChannel(
      baseProfile.advertiser,
      baseProfile.activations,
      channelScope
    );
    if (!advertiser || !activations.length) return null;
    return {
      advertiser,
      activations,
      highlight: pickHighlightActivation(activations),
    };
  }, [baseProfile, channelScope]);

  const chName = useMemo(
    () => Object.fromEntries(channels.map((c) => [c.id, c.name])),
    [channels]
  );

  const channelScopeName = channelScope ? chName[channelScope] || channelScope : null;

  const rawReport = (reports[slug] || null) as ScopedBrandReport | null;

  const report = useMemo(() => {
    if (!rawReport || rawReport.kind !== "marca") return rawReport;
    if (!channelScope) return rawReport;
    return scopeBrandReportToChannel(rawReport, channelScope);
  }, [rawReport, channelScope]);

  const campaignSlug = useMemo(() => {
    if (!profile) return null;
    return findCampaignSlugForAdvertiser(
      profile.advertiser.slug,
      profile.advertiser.name,
      reports
    );
  }, [profile, reports]);

  const campaignReport = useMemo(() => {
    if (!campaignSlug) return null;
    return (reports[campaignReportKey(campaignSlug)] || null) as Parameters<
      typeof BrandProfileSections
    >[0]["campaignReport"];
  }, [campaignSlug, reports]);

  const topActivation = useMemo(() => {
    const activations = profile?.activations ?? [];
    if (!activations.length) return null;
    const withQuote = activations.filter((a) => a.quote.trim());
    const pool = withQuote.length ? withQuote : activations;
    return [...pool].sort(
      (a, b) => (b.concurrentViewers ?? 0) - (a.concurrentViewers ?? 0)
    )[0];
  }, [profile]);

  const featuredHighlight = useMemo(() => {
    if (!profile) return null;
    return profile.highlight ?? pickHighlightActivation(profile.activations);
  }, [profile]);

  function brandProfileUrl(nextTab: BrandProfileTabId) {
    const params = new URLSearchParams();
    if (nextTab !== "resumen") params.set("tab", nextTab);
    if (channelScope) params.set("channel", channelScope);
    const q = params.toString();
    return q ? `/marcas/${slug}?${q}` : `/marcas/${slug}`;
  }

  function selectTab(id: BrandProfileTabId) {
    router.replace(brandProfileUrl(id), { scroll: false });
  }

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q && parseBrandProfileTab(q) === "resumen" && q !== "resumen") {
      router.replace(brandProfileUrl("resumen"), { scroll: false });
    }
  }, [searchParams, slug, router, channelScope]);

  if (channelScope && !profile) {
    return (
      <div className="max-w-2xl">
        <Link
          href={`/canales/${channelScope}?tab=marcas`}
          className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block"
        >
          ← {channelScopeName || "Canal"}
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight">Sin pauta en este canal</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Esta marca no tiene apariciones verificadas en {channelScopeName || channelScope} en el
          período capturado.
        </p>
      </div>
    );
  }

  if (!profile || profile.advertiser.confidenceTier === "detected") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Marca no disponible</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Esta marca no tiene respaldo suficiente para investigar en el período capturado.
        </p>
        <Link
          href="/marcas"
          className="inline-block mt-5 text-[13px] text-accent font-medium hover:underline"
        >
          ← Volver a marcas
        </Link>
      </div>
    );
  }

  if (!report || report.kind !== "marca" || !report.detail?.length) {
    return (
      <div className="max-w-2xl">
        <Link href="/marcas" className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block">
          ← Marcas
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight">{profile.advertiser.name}</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Sin apariciones de pauta en el export actual para profundizar.
        </p>
      </div>
    );
  }

  const { advertiser } = profile;
  const entityCoverage = brandEntityCoverage(advertiser);
  const hideTabIds: BrandProfileTabId[] = channelScope ? ["canales"] : [];

  return (
    <div className="max-w-5xl pb-10">
      {channelScope ? (
        <Link
          href={`/canales/${channelScope}?tab=marcas`}
          className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block"
        >
          ← {channelScopeName} · Marcas activas
        </Link>
      ) : (
        <Link
          href="/marcas"
          className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block"
        >
          ← Marcas
        </Link>
      )}

      <header className="mb-2">
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-ink">
          {advertiser.name}
        </h1>
        {channelScope && channelScopeName ? (
          <p className="text-[14px] text-gray-500 mt-1">
            Pauta en <b className="text-gray-700">{channelScopeName}</b> — solo apariciones de este
            canal.
          </p>
        ) : null}
      </header>

      {channelScope ? (
        <EntityCoverageLine text={entityCoverage} className="mb-4" />
      ) : (
        <CoverageLine coverage={coverage} className="mb-4" />
      )}

      <ProfileEvidenceHero
        advertiser={advertiser}
        highlight={featuredHighlight}
        activation={topActivation}
        campaignSlug={campaignSlug}
        profileSlug={slug}
      />

      {campaignSlug && campaignReport ? (
        <CampaignDeliveryBanner
          campaignSlug={campaignSlug}
          campaignReport={campaignReport}
          chName={chName}
        />
      ) : null}

      <BrandProfileTabBar active={tab} onSelect={selectTab} hideTabIds={hideTabIds} />

      <BrandProfileSections
        tab={tab}
        slug={slug}
        advertiser={advertiser}
        report={report as Parameters<typeof BrandProfileSections>[0]["report"]}
        chName={chName}
        moments={moments}
        campaignSlug={campaignSlug}
        campaignReport={campaignReport}
        onOpenMoment={setOpenMention}
        allReports={reports as Record<string, { name: string; detail?: Record<string, unknown>[] }>}
        channelScope={channelScope || undefined}
      />

      {openMention && (
        <MomentModal
          mention={openMention}
          moment={moments[String(openMention.video_id)] || null}
          brandName={advertiser.name}
          onClose={() => setOpenMention(null)}
        />
      )}
    </div>
  );
}

export default function MarcaProfilePage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400">Cargando perfil…</div>}>
      <MarcaProfileInner />
    </Suspense>
  );
}
