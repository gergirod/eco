"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ChannelProfileHero from "@/components/channels/channel-profile/ChannelProfileHero";
import ChannelProfileSections from "@/components/channels/channel-profile/ChannelProfileSections";
import ChannelProfileTabBar from "@/components/channels/channel-profile/ChannelProfileTabBar";
import CoverageLine from "@/components/CoverageLine";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import {
  parseChannelProfileTab,
  type ChannelProfileTabId,
} from "@/components/channels/channel-profile/tabs";
import { getChannelProfile } from "@/lib/channelProfile";
import type { PlacementExport } from "@/lib/placement";
import { useDataset } from "@/lib/useDataset";
import audienceFb from "@/data/audience.json";
import benchmarkFb from "@/data/benchmark.json";
import channelsFb from "@/data/channels.json";
import momentsFb from "@/data/moments.json";
import placementFb from "@/data/placement.json";
import reportsFb from "@/data/reports.json";

function CanalProfileInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelId = typeof params.id === "string" ? params.id : "";

  const channels = useDataset("channels", channelsFb);
  const audience = useDataset("audience", audienceFb);
  const benchmark = useDataset("benchmark", benchmarkFb);
  const reports = useDataset("reports", reportsFb);
  const moments = useDataset("moments", momentsFb);
  const placement = useDataset("placement", placementFb) as PlacementExport;

  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);

  const tab = parseChannelProfileTab(searchParams.get("tab"));
  const showFilter = searchParams.get("show");

  const profile = useMemo(
    () =>
      getChannelProfile(
        channelId,
        channels as Parameters<typeof getChannelProfile>[1],
        audience as Parameters<typeof getChannelProfile>[2],
        benchmark as Parameters<typeof getChannelProfile>[3],
        reports as Parameters<typeof getChannelProfile>[4],
        moments as Parameters<typeof getChannelProfile>[5]
      ),
    [channelId, channels, audience, benchmark, reports, moments]
  );

  function selectTab(id: ChannelProfileTabId) {
    const params = new URLSearchParams();
    if (id !== "descripcion") params.set("tab", id);
    if (id === "programas" && showFilter) params.set("show", showFilter);
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

      <ChannelProfileHero profile={profile} />

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
