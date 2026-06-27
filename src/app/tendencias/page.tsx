"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TendenciaCard from "@/components/tendencias/TendenciaCard";
import CoverageLine from "@/components/CoverageLine";
import GoogleTrendsControl from "@/components/googleTrends/GoogleTrendsControl";
import {
  countRadarGtInteresting,
  countRadarWithGt,
  isGoogleTrendsInsight,
} from "@/lib/googleTrends";
import { buildTendencias, tendenciasSubline } from "@/lib/tendencias";
import { useCorpus } from "@/lib/useCorpus";
import { usePlatformCoverage } from "@/lib/use-discovery";

export default function TendenciasPage() {
  const [withGoogleTrends, setWithGoogleTrends] = useState(false);
  const corpus = useCorpus([
    "radar",
    "benchmark",
    "audience",
    "brands",
    "meta",
    "chat_demand",
  ] as const);
  const { radar, benchmark, audience, brands, meta, chat_demand: chatDemand } = corpus;
  const coverage = usePlatformCoverage();

  const insights = useMemo(
    () =>
      buildTendencias(
        radar as Parameters<typeof buildTendencias>[0],
        benchmark as Parameters<typeof buildTendencias>[1],
        audience as Parameters<typeof buildTendencias>[2],
        brands as Parameters<typeof buildTendencias>[3],
        meta as Parameters<typeof buildTendencias>[4],
        chatDemand as Parameters<typeof buildTendencias>[5],
        { includeGoogleTrends: withGoogleTrends }
      ),
    [radar, benchmark, audience, brands, meta, chatDemand, withGoogleTrends]
  );

  const gtEnriched = useMemo(() => countRadarWithGt(radar as { gt_status?: string | null }[]), [radar]);
  const gtInteresting = useMemo(
    () => countRadarGtInteresting(radar as { gt_status?: string | null }[]),
    [radar]
  );

  const { gtInsights, otherInsights } = useMemo(() => {
    const gt = insights.filter((i) => isGoogleTrendsInsight(i.id));
    const other = insights.filter((i) => !isGoogleTrendsInsight(i.id));
    return { gtInsights: gt, otherInsights: other };
  }, [insights]);

  const subline = tendenciasSubline(insights.length, meta as Parameters<typeof tendenciasSubline>[1]);

  const byConfidence = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of insights) m[i.confidence] = (m[i.confidence] || 0) + 1;
    return m;
  }, [insights]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
        ¿Qué está cambiando en el mercado?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl">
        Patrones construidos sobre múltiples señales — no es un listado de temas ni predicción.
        Cada ítem habilita una decisión comercial.
      </p>
      <CoverageLine coverage={coverage} />
      <p className="text-[12.5px] text-gray-400 mb-4">{subline}</p>

      <GoogleTrendsControl
        enabled={withGoogleTrends}
        onChange={setWithGoogleTrends}
        enrichedCount={gtEnriched}
        interestingCount={gtInteresting}
      />

      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 text-[12px] text-gray-500">
          {byConfidence.insight ? (
            <span className="px-2.5 py-1 rounded-full bg-accent-soft/60 text-accent">
              {byConfidence.insight} lectura{byConfidence.insight === 1 ? "" : "s"}
            </span>
          ) : null}
          {byConfidence.evidencia ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byConfidence.evidencia} evidencia
            </span>
          ) : null}
          {byConfidence.conversacion ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byConfidence.conversacion} conversación
            </span>
          ) : null}
        </div>
      )}

      <div className="card p-4 mb-6 bg-gray-50/80 border-[#ececec] text-[12.5px] text-gray-600 leading-relaxed">
        <b className="text-gray-700">Período corto (~2 semanas).</b> Son lecturas preliminares.
        No predecimos ni armamos perfiles de tema — solo conclusiones honestas sobre lo capturado.
        {withGoogleTrends && gtInsights.length === 0 && gtEnriched > 0 ? (
          <> Activá la comparación arriba: hay {gtEnriched} temas con cruce, pero ninguno califica para un patrón destacado en esta vista.</>
        ) : null}
      </div>

      {insights.length === 0 ? (
        <div className="card p-8 text-[14px] text-gray-600 leading-relaxed">
          <p className="mb-4">
            Aún no hay patrones con suficiente respaldo en el período. Revisá{" "}
            <Link href="/novedades" className="text-accent font-medium hover:underline">
              Novedades
            </Link>{" "}
            para eventos puntuales.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {withGoogleTrends && gtInsights.length > 0 ? (
            <section>
              <h2 className="text-[15px] font-semibold text-ink mb-1">
                Cruce con búsquedas en Google
              </h2>
              <p className="text-[12.5px] text-gray-500 mb-4 max-w-xl">
                Patrones donde la charla en vivo se compara con el interés de búsqueda en
                Argentina (últimos 12 meses).
              </p>
              <div className="flex flex-col gap-4">
                {gtInsights.map((insight) => (
                  <TendenciaCard key={insight.id} insight={insight} googleTrends />
                ))}
              </div>
            </section>
          ) : null}

          {otherInsights.length > 0 ? (
            <section>
              {withGoogleTrends && gtInsights.length > 0 ? (
                <h2 className="text-[15px] font-semibold text-ink mb-4">Otros patrones</h2>
              ) : null}
              <div className="flex flex-col gap-4">
                {otherInsights.map((insight) => (
                  <TendenciaCard key={insight.id} insight={insight} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Ranking de temas en{" "}
        <Link href="/conversacion" className="text-accent hover:underline">
          Conversación
        </Link>
        . Eventos discretos en{" "}
        <Link href="/novedades" className="text-accent hover:underline">
          Novedades
        </Link>
        . Profundidad por entidad en{" "}
        <Link href="/marcas" className="text-accent hover:underline">
          Marcas
        </Link>{" "}
        y{" "}
        <Link href="/canales" className="text-accent hover:underline">
          Canales
        </Link>
        .
      </p>
    </div>
  );
}
