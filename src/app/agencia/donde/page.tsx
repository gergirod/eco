"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AgenciaCorpusChannels from "@/components/agencia/AgenciaCorpusChannels";
import AgenciaDemandaView from "@/components/agencia/AgenciaDemandaView";
import AgenciaDondeCliente from "@/components/agencia/AgenciaDondeCliente";
import AgenciaDondeTabs from "@/components/agencia/AgenciaDondeTabs";
import AgenciaPageHeader from "@/components/agencia/AgenciaPageHeader";
import AgenciaProgramasTop from "@/components/agencia/AgenciaProgramasTop";
import AgenciaQuestionBlock from "@/components/agencia/AgenciaQuestionBlock";
import AgenciaRubroPicker from "@/components/agencia/AgenciaRubroPicker";
import AgenciaRubroPautarView from "@/components/agencia/AgenciaRubroPautarView";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildDondeRubroPack } from "@/lib/agencia-donde";
import { buildProgramMap, portfolioRubroOptions } from "@/lib/agencia-mapa";
import { buildRubroIntel } from "@/lib/agencia-rubro-intel";
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
    brands,
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
    "brands",
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

  const programs = useMemo(
    () =>
      buildProgramMap(
        channels as never,
        audience as never,
        reportsMap as never,
        moments as never,
        placementExport,
        rubro || null,
        8
      ),
    [channels, audience, reportsMap, moments, placementExport, rubro]
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
      competitorSlugs
    );
  }, [
    rubro,
    activePair,
    placementExport,
    reportsMap,
    schedule_insights,
    commercial_demand,
    chat_insights,
  ]);

  const activeRubroLabel = rubro ? rubroLabel(placementExport, rubro) : "tu rubro";
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
            <AgenciaQuestionBlock question="¿Dónde está la gente mirando?">
              <AgenciaCorpusChannels
                rows={corpusRows}
                meta={meta as never}
                highlightIds={brandChannels.length ? brandChannels : undefined}
                title="8 canales que medimos esta semana"
              />
              {brandChannels.length > 0 && (
                <p className="text-[12px] text-gray-500 mt-3">
                  Resaltados: canales donde ya apareció {brandName}.
                </p>
              )}
            </AgenciaQuestionBlock>

            <AgenciaRubroPautarView pack={rubroIntelPack} />

            {programs.length > 0 && (
              <AgenciaQuestionBlock
                question={`¿En qué programas conviene entrar en ${activeRubroLabel.toLowerCase()}?`}
              >
                <AgenciaProgramasTop programs={programs} limit={5} />
              </AgenciaQuestionBlock>
            )}

            {pack && (
              <AgenciaQuestionBlock question={`¿Qué hacemos con ${brandName}?`}>
                <AgenciaDondeCliente pack={pack} />
              </AgenciaQuestionBlock>
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
          {hasRival && (
            <Link href={`${AGENCIA_BASE}/pulso`} className="text-accent hover:underline">
              ¿Quién ganó miradas? →
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
