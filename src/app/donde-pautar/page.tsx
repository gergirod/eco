"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CoverageLine from "@/components/CoverageLine";
import { ATTENTION_DEFINITION, formatAttentionLiveStats } from "@/lib/coverage";
import { listChannelBrowseItems } from "@/lib/channelProfile";
import { compact } from "@/lib/format";
import {
  buildRubroGapHints,
  buildShowOpportunities,
  type RubroGapHint,
  type ShowOpportunity,
} from "@/lib/opportunity";
import type { PlacementExport } from "@/lib/placement";
import CommercialDemandSection from "@/components/planning/CommercialDemandSection";
import ChatInsightsSection from "@/components/planning/ChatInsightsSection";
import ScheduleInsightsSection from "@/components/planning/ScheduleInsightsSection";
import {
  applyRubroToInsights,
  type ChatInsightsExport,
} from "@/lib/chatInsights";
import {
  filterCommercialByChannels,
  type CommercialDemandExport,
} from "@/lib/commercialDemand";
import {
  applyRubroToSchedule,
  type ScheduleInsightsExport,
} from "@/lib/scheduleInsights";
import {
  CHANNEL_NAME_TO_ID,
  channelIdsForRubro,
  PLANNING_RUBRO_OPTIONS,
} from "@/lib/planningRubro";
import { rubroLabel } from "@/lib/placement";
import { useCorpus } from "@/lib/useCorpus";
import { usePlatformCoverage } from "@/lib/use-discovery";

const CORPUS_KEYS = [
  "audience",
  "benchmark",
  "channels",
  "reports",
  "moments",
  "placement",
  "chat_insights",
  "commercial_demand",
  "schedule_insights",
] as const;

function OpportunityCard({ row }: { row: ShowOpportunity }) {
  return (
    <Link
      href={`/canales/${row.channelId}?tab=programas&show=${row.showId}`}
      className="card p-5 block hover:border-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-gray-400 mb-1">{row.channelName}</p>
          <h2 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
            {row.showName}
          </h2>
          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">{row.gapLabel}</p>
          <p className="text-[12.5px] text-gray-500 mt-2">
            Pico <b className="text-ink">{compact(row.peakAttention)}</b>
            {row.pautaMentions > 0 ? (
              <>
                {" "}
                · {row.pautaMentions} apariciones en {row.emissions}{" "}
                {row.emissions === 1 ? "emisión" : "emisiones"}
              </>
            ) : (
              <> · sin pauta verificada</>
            )}
          </p>
          {(row.topRubroLabel || row.charlaAngle) && (
            <p className="text-[12px] text-gray-400 mt-2">
              {row.topRubroLabel ? `Pauta dominante: ${row.topRubroLabel}` : null}
              {row.topRubroLabel && row.charlaAngle ? " · " : null}
              {row.charlaAngle ? `Charla: ${row.charlaAngle}` : null}
            </p>
          )}
        </div>
        <span className="text-[12.5px] text-accent font-medium shrink-0 group-hover:underline">
          Ver show →
        </span>
      </div>
    </Link>
  );
}

function RubroGapRow({ hint }: { hint: RubroGapHint }) {
  return (
    <Link
      href={`/canales/${hint.channelId}?tab=programas&show=${hint.showId}`}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[13.5px] text-gray-700 leading-relaxed">{hint.summary}</p>
      <p className="text-[12px] text-gray-400 mt-1">
        Pico {compact(hint.peakAttention)} · rubro ausente en el show
      </p>
    </Link>
  );
}

export default function DondePautarPage() {
  const corpus = useCorpus(CORPUS_KEYS);
  const audience = corpus.audience as unknown[];
  const benchmark = corpus.benchmark as unknown[];
  const channelsConfig = corpus.channels as unknown[];
  const reports = corpus.reports as Record<string, unknown>;
  const moments = corpus.moments as Record<string, unknown>;
  const placement = corpus.placement as PlacementExport;
  const chatInsights = corpus.chat_insights as ChatInsightsExport;
  const commercialDemand = corpus.commercial_demand as CommercialDemandExport;
  const scheduleInsights = corpus.schedule_insights as ScheduleInsightsExport;
  const [rubro, setRubro] = useState("");
  const coverage = usePlatformCoverage();

  const rubroChannelIds = useMemo(
    () => channelIdsForRubro(placement, rubro),
    [placement, rubro]
  );

  const filteredInsights = useMemo(
    () =>
      applyRubroToInsights(chatInsights, rubroChannelIds, CHANNEL_NAME_TO_ID),
    [chatInsights, rubroChannelIds]
  );

  const filteredCommercial = useMemo(
    () =>
      filterCommercialByChannels(
        commercialDemand,
        rubroChannelIds.size ? rubroChannelIds : null
      ),
    [commercialDemand, rubroChannelIds]
  );

  const filteredSchedule = useMemo(
    () => applyRubroToSchedule(scheduleInsights, rubroChannelIds),
    [scheduleInsights, rubroChannelIds]
  );

  const channelItems = useMemo(
    () =>
      listChannelBrowseItems(
        channelsConfig as Parameters<typeof listChannelBrowseItems>[0],
        audience as Parameters<typeof listChannelBrowseItems>[1],
        benchmark as Parameters<typeof listChannelBrowseItems>[2]
      ).filter((c) => c.hasCapture),
    [channelsConfig, audience, benchmark]
  );

  const opportunities = useMemo(
    () =>
      buildShowOpportunities(
        channelsConfig as Parameters<typeof buildShowOpportunities>[0],
        audience as Parameters<typeof buildShowOpportunities>[1],
        reports as Parameters<typeof buildShowOpportunities>[2],
        moments as Parameters<typeof buildShowOpportunities>[3],
        placement,
        8,
        rubro || null
      ),
    [channelsConfig, audience, reports, moments, placement, rubro]
  );

  const rubroGaps = useMemo(
    () =>
      buildRubroGapHints(
        channelsConfig as Parameters<typeof buildRubroGapHints>[0],
        audience as Parameters<typeof buildRubroGapHints>[1],
        reports as Parameters<typeof buildRubroGapHints>[2],
        moments as Parameters<typeof buildRubroGapHints>[3],
        placement,
        5
      ).filter((h) => !rubro || h.rubroKey === rubro),
    [channelsConfig, audience, reports, moments, placement, rubro]
  );

  const topChannels = channelItems.slice(0, 5);

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight max-w-2xl">
        ¿Dónde conviene pautar con la atención que ya medimos?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl leading-relaxed">
        Lectura rápida para armar un plan: programas con mucha gente mirando y poca pauta en lo que
        medimos. {ATTENTION_DEFINITION}
      </p>
      <CoverageLine coverage={coverage} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="planning-rubro" className="text-[13px] text-gray-600">
          Rubro objetivo
        </label>
        <select
          id="planning-rubro"
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          className="text-[13px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-ink min-w-[200px]"
        >
          {PLANNING_RUBRO_OPTIONS.map((o) => (
            <option key={o.id || "all"} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {rubro && (
          <span className="text-[12px] text-gray-400">
            Salas y huecos donde pauta {rubroLabel(placement, rubro).toLowerCase()}
          </span>
        )}
      </div>

      <CommercialDemandSection
        report={filteredCommercial}
        rubroLabel={rubro ? rubroLabel(placement, rubro) : null}
      />

      <ChatInsightsSection
        insights={filteredInsights}
        rubroLabel={rubro ? rubroLabel(placement, rubro) : null}
      />

      <ScheduleInsightsSection
        insights={filteredSchedule}
        rubroLabel={rubro ? rubroLabel(placement, rubro) : null}
      />

      {opportunities.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-[15px] font-semibold text-ink">Mucha gente mirando, poca pauta</h2>
            <span className="text-[12px] text-gray-400">{opportunities.length} programas</span>
          </div>
          <div className="flex flex-col gap-3">
            {opportunities.map((row) => (
              <OpportunityCard key={row.id} row={row} />
            ))}
          </div>
        </section>
      )}

      {rubroGaps.length > 0 && (
        <section className="mt-10 card p-5">
          <h2 className="text-[15px] font-semibold text-ink mb-1">Huecos por rubro</h2>
          <p className="text-[13px] text-gray-500 mb-4 max-w-xl leading-relaxed">
            Shows con buena audiencia donde un rubro que domina el canal casi no aparece — útil para
            proponer un vertical concreto en una reunión.
          </p>
          <div>
            {rubroGaps.map((hint) => (
              <RubroGapRow key={hint.id} hint={hint} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-[15px] font-semibold text-ink">Canales con más atención medida</h2>
          <Link href="/canales" className="text-[12.5px] text-accent font-medium hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {topChannels.map((ch) => {
            const attentionLine = formatAttentionLiveStats(ch.avgConcurrent, ch.peakConcurrent);
            return (
              <Link
                key={ch.id}
                href={`/canales/${ch.id}?tab=programas`}
                className="card p-4 block hover:border-accent/30 transition-colors"
              >
                <h3 className="text-[15px] font-semibold text-ink">{ch.name}</h3>
                {attentionLine && (
                  <p className="text-[12.5px] text-gray-600 mt-1.5">{attentionLine}</p>
                )}
                <p className="text-[12px] text-gray-400 mt-1">
                  {ch.brands} marcas · {ch.mentions} apariciones de pauta
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10 card p-5 bg-gray-50/80 border-gray-100">
        <h2 className="text-[14px] font-semibold text-ink mb-2">¿Importa el ángulo de contenido?</h2>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3 max-w-xl">
          Para ver si el ángulo de la charla cierra antes de proponer un programa, cruzá con los
          temas que se repiten en el período.
        </p>
        <Link href="/conversacion" className="text-[13px] text-accent font-medium hover:underline">
          Ver Conversación →
        </Link>
      </section>

      <p className="text-[11px] text-gray-400 mt-8 leading-relaxed max-w-xl">
        Lectura preliminar sobre lo que medimos — no es recomendación de compra ni predicción de
        resultados. La pauta cuenta apariciones verificadas en audio; algunos programas pueden
        mostrar audiencia sin rubro o temas todavía.
      </p>
    </div>
  );
}
