"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConversacionRow from "@/components/conversacion/ConversacionRow";
import CoverageLine from "@/components/CoverageLine";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import {
  buildConversacionRanking,
  conversacionSubline,
} from "@/lib/conversacion";
import { useDataset } from "@/lib/useDataset";
import metaFb from "@/data/meta.json";
import radarFb from "@/data/radar.json";

export default function ConversacionPage() {
  const radar = useDataset("radar", radarFb);
  const meta = useDataset("meta", metaFb);
  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);
  const [crossOnly, setCrossOnly] = useState(true);

  const topics = useMemo(
    () =>
      buildConversacionRanking(radar as Parameters<typeof buildConversacionRanking>[0], {
        crossOnly,
        limit: crossOnly ? 20 : 30,
      }),
    [radar, crossOnly]
  );

  const subline = conversacionSubline(
    topics,
    crossOnly,
    meta as Parameters<typeof conversacionSubline>[2]
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
        ¿De qué se habla en el streaming?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl">
        Ranking de conversación en los programas que monitoreamos — extraído del audio, no de
        marcas ni pauta. Un tema fuerte acá es señal de contenido, no de publicidad.
      </p>
      <CoverageLine coverage={coverage} />
      <p className="text-[12.5px] text-gray-400 mb-5">{subline}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setCrossOnly(true)}
          className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
            crossOnly
              ? "bg-ink text-white border-ink"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          Cross-canal (recomendado)
        </button>
        <button
          type="button"
          onClick={() => setCrossOnly(false)}
          className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
            !crossOnly
              ? "bg-ink text-white border-ink"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          Todos los temas
        </button>
      </div>

      <div className="card p-4 mb-6 bg-gray-50/80 border-[#ececec] text-[12.5px] text-gray-600 leading-relaxed space-y-2">
        <p>
          <b className="text-gray-700">Esto no es Tendencias.</b> Acá ves qué temas dominan la
          charla. En{" "}
          <Link href="/tendencias" className="text-accent font-medium hover:underline">
            Tendencias
          </Link>{" "}
          ves patrones de mercado (cambios, oportunidades, señales compuestas).
        </p>
        <p>
          <b className="text-gray-700">Esto no es Marcas.</b> Las marcas con pauta verificada viven
          en{" "}
          <Link href="/marcas" className="text-accent font-medium hover:underline">
            Marcas
          </Link>
          . Un tema caliente no implica sponsor.
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="card p-8 text-[14px] text-gray-600 leading-relaxed">
          <p>
            Aún no hay temas en 2+ canales con masa en el período. Probá{" "}
            <button
              type="button"
              onClick={() => setCrossOnly(false)}
              className="text-accent font-medium hover:underline"
            >
              todos los temas
            </button>{" "}
            o revisá{" "}
            <Link href="/novedades" className="text-accent font-medium hover:underline">
              Novedades
            </Link>{" "}
            para eventos puntuales.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <ConversacionRow key={topic.tema} topic={topic} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Temas unificados por IA a partir de lo dicho en los programas · filtro anti-meme: priorizamos aparición en
        2+ comunidades. Expandí cada tema para ver qué dijeron los conductores y en qué canal.
        Variantes ruidosas (p.ej. mundial*) se agrupan en una sola entrada.
      </p>
    </div>
  );
}
