"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AgenciaCanalesAudiencia from "@/components/agencia/AgenciaCanalesAudiencia";
import AgenciaPlanMarca from "@/components/agencia/AgenciaPlanMarca";
import AgenciaVsRivalBlock from "@/components/agencia/AgenciaVsRivalBlock";
import AgenciaDemandaView from "@/components/agencia/AgenciaDemandaView";
import AgenciaDondeTabs from "@/components/agencia/AgenciaDondeTabs";
import AgenciaPageHeader from "@/components/agencia/AgenciaPageHeader";
import AgenciaProgramasTop from "@/components/agencia/AgenciaProgramasTop";
import AgenciaQuestionBlock from "@/components/agencia/AgenciaQuestionBlock";
import AgenciaRubroPicker from "@/components/agencia/AgenciaRubroPicker";
import AgenciaRubroPautarView from "@/components/agencia/AgenciaRubroPautarView";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildAgenciaPlanPack } from "@/lib/agencia-plan";
import { buildDondeRubroPack } from "@/lib/agencia-donde";
import { buildProgramMap, portfolioRubroOptions } from "@/lib/agencia-mapa";
import { buildRubroIntel } from "@/lib/agencia-rubro-intel";
import { buildChannelAudienceRows } from "@/lib/agencia-audiencia";
import { buildCorpusChannelMatrix } from "@/lib/corpus-channels";
import { rubroDisplay } from "@/lib/agencia-product";
import { rubroLabel } from "@/lib/placement";
import { useActiveBrand } from "@/lib/use-active-brand";
import { buildShowOpportunities } from "@/lib/opportunity";
import { useCorpus } from "@/lib/useCorpus";
import type { PlacementExport } from "@/lib/placement";
import type { CommercialDemandExport } from "@/lib/commercialDemand";
import type { ChatInsightsExport } from "@/lib/chatInsights";
import type { ScheduleInsightsExport } from "@/lib/scheduleInsights";
import type { SalaSignalsExport } from "@/lib/sala-signals";

export default function AgenciaDondePage() {
  const { activePair, activeSlug, loading, hasRival, config } = useActiveBrand();
  const [tab, setTab] = useState<"pautar" | "demanda">("pautar");
  const [rubroOverride, setRubroOverride] = useState<string | null>(null);

  const {
    reports,
    channels,
    audience,
    moments,
    placement,
    meta,
    schedule_insights,
    commercial_demand,
    chat_insights,
    sala_signals,
    brands,
    brand_history,
  } = useCorpus([
    "reports",
    "channels",
    "audience",
    "moments",
    "placement",
    "meta",
    "schedule_insights",
    "commercial_demand",
    "chat_insights",
    "sala_signals",
    "brands",
    "brand_history",
  ] as const);

  const reportsMap = reports as Record<string, never>;
  const placementExport = placement as PlacementExport;

  const rubroOptions = useMemo(() => {
    const all = portfolioRubroOptions(config.pairs, placementExport);
    return all.filter((o) => o.id !== "");
  }, [config.pairs, placementExport]);

  const multiRubro = rubroOptions.length > 1;

  useEffect(() => {
    setRubroOverride(null);
  }, [activeSlug]);

  const rubro = rubroOverride ?? activePair?.rubro ?? "";

  const brandName = useMemo(() => {
    const row = (brands as { slug: string; name: string }[]).find((b) => b.slug === activeSlug);
    return row?.name ?? activeSlug ?? "tu cliente";
  }, [brands, activeSlug]);

  const brandChannels = useMemo(() => {
    const row = (brands as { slug: string; channels?: string[] }[]).find(
      (b) => b.slug === activeSlug
    );
    return row?.channels ?? [];
  }, [brands, activeSlug]);

  const corpusRows = useMemo(
    () => buildCorpusChannelMatrix(meta as never, channels as never, brands as never),
    [meta, channels, brands]
  );

  const channelAudience = useMemo(
    () =>
      buildChannelAudienceRows(
        audience as never,
        corpusRows,
        placementExport,
        rubro || null
      ),
    [audience, corpusRows, placementExport, rubro]
  );

  const programs = useMemo(
    () =>
      buildProgramMap(
        channels as never,
        audience as never,
        reportsMap as never,
        moments as never,
        placementExport,
        rubro || null,
        8,
        schedule_insights as ScheduleInsightsExport
      ),
    [channels, audience, reportsMap, moments, placementExport, rubro, schedule_insights]
  );

  const pack = useMemo(() => {
    if (!activePair) return null;
    const opps = buildShowOpportunities(
      channels as never,
      audience as never,
      reportsMap,
      moments as never,
      placementExport,
      3,
      activePair.rubro
    );
    return buildDondeRubroPack(
      activePair,
      rubroDisplay(activePair.rubro),
      reportsMap[activePair.slug] as never,
      activePair.competitorSlug ? (reportsMap[activePair.competitorSlug] as never) : null,
      opps
    );
  }, [activePair, channels, audience, reportsMap, moments, placementExport]);

  const rubroIntelPack = useMemo(() => {
    if (!rubro || !activePair) return null;
    const clientSlugs = [activePair.slug];
    const competitorSlugs = activePair.competitorSlug ? [activePair.competitorSlug] : [];
    return buildRubroIntel(
      rubro,
      placementExport,
      reportsMap,
      schedule_insights as ScheduleInsightsExport,
      commercial_demand as CommercialDemandExport,
      chat_insights as ChatInsightsExport,
      clientSlugs,
      competitorSlugs,
      sala_signals as SalaSignalsExport
    );
  }, [
    rubro,
    activePair,
    placementExport,
    reportsMap,
    schedule_insights,
    commercial_demand,
    chat_insights,
    sala_signals,
  ]);

  const activeRubroLabel = rubro ? rubroLabel(placementExport, rubro) : "tu rubro";

  const brandRow = useMemo(() => {
    return (brands as { slug: string; first_seen?: string; last_seen?: string; n_activations?: number; channels?: string[] }[]).find(
      (b) => b.slug === activeSlug
    );
  }, [brands, activeSlug]);

  const planPack = useMemo(() => {
    if (!activePair || !pack) return null;
    return buildAgenciaPlanPack({
      pair: activePair,
      brandName,
      rubroLabel: activeRubroLabel,
      dondePack: pack,
      channelAudience,
      programs,
      audience: audience as never,
      brandRow,
      brandHistory: brand_history as never,
      meta: meta as never,
    });
  }, [
    activePair,
    pack,
    brandName,
    activeRubroLabel,
    channelAudience,
    programs,
    audience,
    brandRow,
    brand_history,
    meta,
  ]);

  const exportedAt = (meta as { exported_at?: string }).exported_at;

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  if (!activePair) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <p className="text-[14px] text-gray-600 mb-4">Elegí una marca para ver el mercado.</p>
        <Link href={`${AGENCIA_BASE}/elegir`} className="btn btn-primary text-[13px]">
          Elegir marca →
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-2xl">
      <AgenciaPageHeader
        question="¿Dónde conviene pautar?"
        when={`Esta semana en stream — mercado de ${activeRubroLabel.toLowerCase()} y qué hacer con ${brandName}.`}
      />

      {multiRubro && (
        <div className="mb-6">
          <p className="text-[12px] text-gray-500 mb-2">Rubro del mercado</p>
          <AgenciaRubroPicker
            options={rubroOptions}
            value={rubro}
            onChange={setRubroOverride}
          />
        </div>
      )}

      <AgenciaDondeTabs active={tab} onChange={setTab} showDemanda />

      <div className="mt-8 space-y-10">
        {tab === "pautar" && rubroIntelPack && (
          <>
            {planPack && (
              <AgenciaQuestionBlock question={`¿Qué hacemos con ${brandName}?`}>
                <AgenciaPlanMarca pack={planPack} />
              </AgenciaQuestionBlock>
            )}

            {channelAudience.length > 0 && (
              <AgenciaQuestionBlock question="¿Dónde está la gente mirando?">
                <AgenciaCanalesAudiencia
                  rows={channelAudience}
                  highlightIds={brandChannels.length ? brandChannels : undefined}
                  rubroLabel={activeRubroLabel}
                />
                {brandChannels.length > 0 && (
                  <p className="text-[12px] text-gray-500 mt-3">
                    Resaltados: canales donde ya apareció {brandName}.
                  </p>
                )}
              </AgenciaQuestionBlock>
            )}

            {programs.length > 0 && (
              <AgenciaQuestionBlock
                question={`¿En qué programas conviene entrar en ${activeRubroLabel.toLowerCase()}?`}
              >
                <AgenciaProgramasTop
                  programs={programs}
                  limit={5}
                  rubroLabel={activeRubroLabel}
                />
              </AgenciaQuestionBlock>
            )}

            <AgenciaRubroPautarView pack={rubroIntelPack} />

            {hasRival && activePair && (
              <AgenciaVsRivalBlock pair={activePair} brandName={brandName} />
            )}
          </>
        )}

        {tab === "demanda" && rubroIntelPack && (
          <AgenciaDemandaView pack={rubroIntelPack} rubroLabel={activeRubroLabel} />
        )}
      </div>

      <footer className="mt-14 pt-8 border-t border-gray-100">
        <p className="text-[12px] text-gray-400 leading-relaxed">
          {exportedAt
            ? `Esta semana en 8 canales · ${new Date(exportedAt).toLocaleDateString("es-AR")}`
            : "Esta semana en 8 canales"}
        </p>
        <div className="flex flex-wrap gap-4 mt-4 text-[13px]">
          <Link href={AGENCIA_BASE} className="text-accent hover:underline">
            ← ¿Rindió la placa?
          </Link>
        </div>
      </footer>
    </div>
  );
}
