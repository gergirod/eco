"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ChannelProfileHero from "@/components/channels/channel-profile/ChannelProfileHero";
import ChannelProfileSections from "@/components/channels/channel-profile/ChannelProfileSections";
import ChannelProfileTabBar from "@/components/channels/channel-profile/ChannelProfileTabBar";
import CoverageLine from "@/components/CoverageLine";
import {
  parseChannelProfileTab,
  type ChannelProfileTabId,
} from "@/components/channels/channel-profile/tabs";
import { getChannelProfile } from "@/lib/channelProfile";
import type { PlacementExport } from "@/lib/placement";
import type { CommercialDemandExport } from "@/lib/commercialDemand";
import { useCorpus } from "@/lib/useCorpus";
import { usePlatformCoverage } from "@/lib/use-discovery";
import { getLiveCapture, type LiveCaptureStats } from "@/lib/liveCapture";

const CORPUS_KEYS = [
  "channels",
  "audience",
  "benchmark",
  "reports",
  "moments",
  "placement",
  "commercial_demand",
  "meta",
] as const;

function CanalProfileInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelId = typeof params.id === "string" ? params.id : "";

  const corpus = useCorpus(CORPUS_KEYS);
  const channels = corpus.channels as Parameters<typeof getChannelProfile>[1];
  const audience = corpus.audience as Parameters<typeof getChannelProfile>[2];
  const benchmark = corpus.benchmark as Parameters<typeof getChannelProfile>[3];
  const reports = corpus.reports as Parameters<typeof getChannelProfile>[4];
  const moments = corpus.moments as Parameters<typeof getChannelProfile>[5];
  const placement = corpus.placement as PlacementExport;
  const commercialDemand = corpus.commercial_demand as CommercialDemandExport;
  const meta = corpus.meta as { live_capture?: LiveCaptureStats };

  const liveCapture = useMemo(() => getLiveCapture(meta), [meta]);
  const coverage = usePlatformCoverage();

  const tab = parseChannelProfileTab(searchParams.get("tab"));
  const showFilter = searchParams.get("show");

  const profile = useMemo(
    () => getChannelProfile(channelId, channels, audience, benchmark, reports, moments),
    [channelId, channels, audience, benchmark, reports, moments]
  );

  function selectTab(id: ChannelProfileTabId) {
    const params = new URLSearchParams();
    if (id !== "descripcion") params.set("tab", id);
    const q = params.toString();
    router.replace(q ? `/canales/${channelId}?${q}` : `/canales/${channelId}`, { scroll: false });
  }

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q && parseChannelProfileTab(q) === "descripcion" && q !== "descripcion") {
      router.replace(`/canales/${channelId}`, { scroll: false });
    }
  }, [searchParams, channelId, router]);

  if (!profile) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Canal no encontrado</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Este canal no está en la configuración de monitoreo.
        </p>
        <Link
          href="/canales"
          className="inline-block mt-5 text-[13px] text-accent font-medium hover:underline"
        >
          ← Volver a canales
        </Link>
      </div>
    );
  }

  const { config } = profile;

  return (
    <div className="max-w-5xl pb-10">
      <Link
        href="/canales"
        className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block"
      >
        ← Canales
      </Link>

      <header className="mb-2">
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-ink">
          {config.name}
        </h1>
      </header>

      <CoverageLine coverage={coverage} className="mb-4" />

      <ChannelProfileHero profile={profile} liveCapture={liveCapture} />

      {!profile.hasCapture && (
        <div className="card p-4 mb-6 text-[13.5px] text-gray-600 bg-amber-50/50 border-amber-100">
          Sin captura comercial o de audiencia en el período actual. El perfil muestra configuración
          y estado de monitoreo; los datos se completarán cuando capturemos nuevas emisiones.
        </div>
      )}

      <ChannelProfileTabBar active={tab} onSelect={selectTab} />

      <ChannelProfileSections
        tab={tab}
        profile={profile}
        allBenchmark={benchmark as Parameters<typeof ChannelProfileSections>[0]["allBenchmark"]}
        allAudience={audience as Parameters<typeof ChannelProfileSections>[0]["allAudience"]}
        chName={Object.fromEntries(channels.map((c) => [c.id, c.name]))}
        showFilter={showFilter}
        placement={placement}
        commercialDemand={commercialDemand}
        liveCapture={liveCapture}
      />
    </div>
  );
}

export default function CanalProfilePage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400">Cargando perfil…</div>}>
      <CanalProfileInner />
    </Suspense>
  );
}
