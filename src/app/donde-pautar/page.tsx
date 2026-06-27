"use client";

import Link from "next/link";
import { useMemo } from "react";
import CoverageLine from "@/components/CoverageLine";
import { ATTENTION_DEFINITION, formatAttentionLiveStats } from "@/lib/coverage";
import { listChannelBrowseItems } from "@/lib/channelProfile";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import { compact } from "@/lib/format";
import {
  buildRubroGapHints,
  buildShowOpportunities,
  type RubroGapHint,
  type ShowOpportunity,
} from "@/lib/opportunity";
import type { PlacementExport } from "@/lib/placement";
import ChatInsightsSection from "@/components/planning/ChatInsightsSection";
import type { ChatInsightsExport } from "@/lib/chatInsights";
import { useDataset } from "@/lib/useDataset";
import audienceFb from "@/data/audience.json";
import benchmarkFb from "@/data/benchmark.json";
import channelsFb from "@/data/channels.json";
import momentsFb from "@/data/moments.json";
import placementFb from "@/data/placement.json";
import reportsFb from "@/data/reports.json";
import chatInsightsFb from "@/data/chat_insights.json";

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
  const audience = useDataset("audience", audienceFb);
  const benchmark = useDataset("benchmark", benchmarkFb);
  const channelsConfig = useDataset("channels", channelsFb);
  const reports = useDataset("reports", reportsFb);
  const moments = useDataset("moments", momentsFb);
  const placement = useDataset("placement", placementFb) as PlacementExport;
  const chatInsights = useDataset("chat_insights", chatInsightsFb) as ChatInsightsExport;

  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);

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
        8
      ),
    [channelsConfig, audience, reports, moments, placement]
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
      ),
    [channelsConfig, audience, reports, moments, placement]
  );

  const topChannels = channelItems.slice(0, 5);

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight max-w-2xl">
        ¿Dónde conviene pautar con la atención que ya medimos?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl leading-relaxed">
        Lectura rápida para armar un plan: slots con alta atención y poca densidad de pauta en el
        período capturado. {ATTENTION_DEFINITION}
      </p>
      <CoverageLine coverage={coverage} />

      <ChatInsightsSection insights={chatInsights} />

      {opportunities.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-[15px] font-semibold text-ink">Alta atención, poca pauta</h2>
            <span className="text-[12px] text-gray-400">{opportunities.length} slots</span>
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
            Shows con atención fuerte donde un rubro que domina el canal casi no aparece — útil para
            proponer un vertical concreto en una call.
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
          Para validar fit creativo antes de proponer un slot, cruzá con los temas que se repiten en
          la charla del período.
        </p>
        <Link href="/conversacion" className="text-[13px] text-accent font-medium hover:underline">
          Ver Conversación →
        </Link>
      </section>

      <p className="text-[11px] text-gray-400 mt-8 leading-relaxed max-w-xl">
        Lectura preliminar sobre el corpus capturado — no es recomendación de compra ni predicción
        de performance. La densidad de pauta usa apariciones verificadas en audio; shows sin
        procesamiento pueden mostrar atención sin rubro/temas aún.
      </p>
    </div>
  );
}
