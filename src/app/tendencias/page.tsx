"use client";

import Link from "next/link";
import { useMemo } from "react";
import TendenciaCard from "@/components/tendencias/TendenciaCard";
import CoverageLine from "@/components/CoverageLine";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import { buildTendencias, tendenciasSubline } from "@/lib/tendencias";
import { useDataset } from "@/lib/useDataset";
import audienceFb from "@/data/audience.json";
import benchmarkFb from "@/data/benchmark.json";
import brandsFb from "@/data/brands.json";
import metaFb from "@/data/meta.json";
import radarFb from "@/data/radar.json";
import chatDemandFb from "@/data/chat_demand.json";

export default function TendenciasPage() {
  const radar = useDataset("radar", radarFb);
  const benchmark = useDataset("benchmark", benchmarkFb);
  const audience = useDataset("audience", audienceFb);
  const brands = useDataset("brands", brandsFb);
  const meta = useDataset("meta", metaFb);
  const chatDemand = useDataset("chat_demand", chatDemandFb);
  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);

  const insights = useMemo(
    () =>
      buildTendencias(
        radar as Parameters<typeof buildTendencias>[0],
        benchmark as Parameters<typeof buildTendencias>[1],
        audience as Parameters<typeof buildTendencias>[2],
        brands as Parameters<typeof buildTendencias>[3],
        meta as Parameters<typeof buildTendencias>[4],
        chatDemand as Parameters<typeof buildTendencias>[5]
      ),
    [radar, benchmark, audience, brands, meta, chatDemand]
  );

  const subline = tendenciasSubline(insights.length, meta as Parameters<typeof tendenciasSubline>[1]);

  const gtEnriched = useMemo(
    () =>
      (radar as { gt_status?: string | null }[]).filter(
        (r) => r.gt_status === "adelantado" || r.gt_status === "pre_busqueda"
      ).length,
    [radar]
  );
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
      <p className="text-[12.5px] text-gray-400 mb-6">{subline}</p>

      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 text-[12px] text-gray-500">
          {byConfidence.insight ? (
            <span className="px-2.5 py-1 rounded-full bg-accent-soft/60 text-accent">
              {byConfidence.insight} insight{byConfidence.insight === 1 ? "" : "s"}
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
        <b className="text-gray-700">Corpus corto (~2 semanas).</b> Los patrones son exploratorios.
        No usamos forecasting ni temas como perfiles — solo conclusiones honestas sobre lo capturado.
        {gtEnriched === 0 ? (
          <>
            {" "}
            La validación con búsqueda AR aún no está en el export — corré{" "}
            <code className="text-[11px] bg-white px-1 rounded">python radar.py --enrich</code> en el
            pipeline y luego <code className="text-[11px] bg-white px-1 rounded">export_ui.py</code>.
          </>
        ) : (
          <> {gtEnriched} patrón{gtEnriched === 1 ? "" : "es"} con señal de anticipación vs búsqueda.</>
        )}
      </div>

      {insights.length === 0 ? (
        <div className="card p-8 text-[14px] text-gray-600 leading-relaxed">
          <p className="mb-4">
            Aún no hay patrones con masa crítica en el export actual. Revisá{" "}
            <Link href="/novedades" className="text-accent font-medium hover:underline">
              Novedades
            </Link>{" "}
            para eventos puntuales.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {insights.map((insight) => (
            <TendenciaCard key={insight.id} insight={insight} />
          ))}
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
