"use client";

import Link from "next/link";
import { useMemo } from "react";
import NovedadCard from "@/components/novedades/NovedadCard";
import CoverageLine from "@/components/CoverageLine";
import { buildNovedades, filterNovedadesForSlugs, novedadesCoverageLine } from "@/lib/novedades";
import { usePartner } from "@/contexts/PartnerContext";
import { useCorpus } from "@/lib/useCorpus";
import { usePlatformCoverage } from "@/lib/use-discovery";

const WINDOW_DAYS = 7;

export default function NovedadesPage() {
  const { isScoped, partner } = usePartner();
  const { brands, reports, channels, meta, moments } = useCorpus([
    "brands",
    "reports",
    "channels",
    "meta",
    "moments",
  ] as const);
  const coverage = usePlatformCoverage();

  const allEvents = useMemo(
    () =>
      buildNovedades(
        brands as Parameters<typeof buildNovedades>[0],
        reports as Parameters<typeof buildNovedades>[1],
        channels as Parameters<typeof buildNovedades>[2],
        meta as Parameters<typeof buildNovedades>[3],
        { windowDays: WINDOW_DAYS },
        moments as Parameters<typeof buildNovedades>[5]
      ),
    [brands, reports, channels, meta, moments]
  );

  const events = useMemo(() => {
    if (!isScoped || !partner) return allEvents;
    const slugs = [...partner.brand_slugs, ...partner.competitor_slugs];
    return filterNovedadesForSlugs(
      allEvents,
      slugs,
      reports as Parameters<typeof filterNovedadesForSlugs>[2]
    );
  }, [allEvents, isScoped, partner, reports]);

  const subline = novedadesCoverageLine(
    events,
    WINDOW_DAYS,
    (meta as { exported_at?: string }).exported_at || ""
  );

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of events) m[e.category] = (m[e.category] || 0) + 1;
    return m;
  }, [events]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
        ¿Qué pasó recientemente que merece tu atención?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl">
        {isScoped && partner
          ? "Lo que pasó esta semana con tus marcas y competidores — cada ítem es algo concreto para revisar."
          : "Briefing de eventos del ecosistema — no es histórico ni analítico. Cada ítem es algo que pasó una vez y podés investigar."}
      </p>
      <CoverageLine coverage={coverage} />
      <p className="text-[12.5px] text-gray-400 mb-6">{subline}</p>

      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 text-[12px] text-gray-500">
          {byCategory.marca ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byCategory.marca} marca{byCategory.marca === 1 ? "" : "s"}
            </span>
          ) : null}
          {byCategory.programa ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byCategory.programa} programa{byCategory.programa === 1 ? "" : "s"}
            </span>
          ) : null}
          {byCategory.informe ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byCategory.informe} informe{byCategory.informe === 1 ? "" : "s"}
            </span>
          ) : null}
          {byCategory.captura ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byCategory.captura} captura{byCategory.captura === 1 ? "" : "s"}
            </span>
          ) : null}
          {byCategory.chat ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-50">
              {byCategory.chat} chat
            </span>
          ) : null}
        </div>
      )}

      {events.length === 0 ? (
        <div className="card p-8 text-[14px] text-gray-600 leading-relaxed">
          <p className="mb-4">
            No hay eventos nuevos en los últimos {WINDOW_DAYS} días con los datos actuales.
          </p>
          <p>
            Explorá{" "}
            <Link href="/marcas" className="text-accent font-medium hover:underline">
              Marcas
            </Link>{" "}
            o{" "}
            <Link href="/canales" className="text-accent font-medium hover:underline">
              Canales
            </Link>{" "}
            para investigar en profundidad.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <NovedadCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Solo eventos que podemos sostener con la captura actual. Ranking de temas en{" "}
        <Link href="/conversacion" className="text-accent hover:underline">
          Conversación
        </Link>
        . Patrones de mercado en{" "}
        <Link href="/tendencias" className="text-accent hover:underline">
          Tendencias
        </Link>
        .
      </p>
    </div>
  );
}
