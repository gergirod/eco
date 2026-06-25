"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdvertiserBrowseCard from "@/components/discovery/AdvertiserBrowseCard";
import {
  browseAdvertisers,
  countByTier,
  type ConfidenceTier,
  type DiscoveryDataset,
  type DiscoverySortKey,
} from "@/lib/discovery";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

const ALL_TIERS: ConfidenceTier[] = [
  "high_confidence",
  "emerging_confidence",
  "detected",
];

type AdvertiserBrowseProps = {
  dataset: DiscoveryDataset;
  /** Slugs already shown in the hero preview — excluded from alta confianza grid. */
  excludeSlugs?: string[];
};

function BrowseFilters({
  query,
  channel,
  sort,
  channelOptions,
  onQuery,
  onChannel,
  onSort,
}: {
  query: string;
  channel: string;
  sort: DiscoverySortKey;
  channelOptions: string[];
  onQuery: (v: string) => void;
  onChannel: (v: string) => void;
  onSort: (v: DiscoverySortKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Buscar por nombre…"
        className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-accent w-[220px]"
        aria-label="Buscar anunciante"
      />
      <select
        value={channel}
        onChange={(e) => onChannel(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] outline-none focus:border-accent bg-white"
        aria-label="Filtrar por canal"
      >
        <option value="">Todos los canales</option>
        {channelOptions.map((id) => (
          <option key={id} value={id}>
            {CH_NAME[id] || id}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as DiscoverySortKey)}
        className="border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] outline-none focus:border-accent bg-white"
        aria-label="Ordenar lista"
      >
        <option value="peak_conc_at">Mayor audiencia</option>
        <option value="last_seen">Más recientes</option>
      </select>
    </div>
  );
}

function CardGrid({ items }: { items: ReturnType<typeof browseAdvertisers> }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <AdvertiserBrowseCard key={item.slug} item={item} />
      ))}
    </div>
  );
}

export default function AdvertiserBrowse({ dataset, excludeSlugs = [] }: AdvertiserBrowseProps) {
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialChannel = searchParams.get("channel") ?? "";

  const [corpusQuery, setCorpusQuery] = useState(initialQ);
  const [corpusChannel, setCorpusChannel] = useState(initialChannel);
  const [corpusSort, setCorpusSort] = useState<DiscoverySortKey>("peak_conc_at");
  const [emergingOpen, setEmergingOpen] = useState(false);
  const [corpusOpen, setCorpusOpen] = useState(Boolean(initialQ || initialChannel));

  const excluded = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);

  const highCount =
    dataset.meta.highConfidenceAdvertisers || countByTier(dataset, "high_confidence");
  const emergingCount =
    dataset.meta.emergingConfidenceAdvertisers || countByTier(dataset, "emerging_confidence");
  const totalCount = dataset.advertisers.length;

  const channelOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const a of dataset.advertisers) {
      a.channels.forEach((c) => ids.add(c));
    }
    return [...ids].sort((a, b) => (CH_NAME[a] || a).localeCompare(CH_NAME[b] || b));
  }, [dataset]);

  const highConfidenceItems = useMemo(() => {
    const items = browseAdvertisers(dataset, {
      tiers: ["high_confidence"],
      sort: "peak_conc_at",
    });
    if (!excludeSlugs.length) return items;
    return items.filter((item) => !excluded.has(item.slug));
  }, [dataset, excludeSlugs, excluded]);

  const emergingItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ["emerging_confidence"],
        sort: "last_seen",
      }),
    [dataset]
  );

  const corpusItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ALL_TIERS,
        query: corpusQuery,
        channel: corpusChannel,
        sort: corpusSort,
      }),
    [dataset, corpusQuery, corpusChannel, corpusSort]
  );

  const hasCorpusFilters = Boolean(corpusQuery.trim() || corpusChannel);

  return (
    <div className="space-y-12">
      {/* Nivel 1 — Alta confianza */}
      <section id="alta-confianza" className="scroll-mt-6">
        <div className="mb-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            Alta confianza
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            {highCount} {highCount === 1 ? "anunciante recomendado" : "anunciantes recomendados"}{" "}
            para investigar primero
          </p>
        </div>
        {highConfidenceItems.length > 0 ? (
          <CardGrid items={highConfidenceItems} />
        ) : (
          <p className="text-[13px] text-gray-400">Sin anunciantes de alta confianza en el período.</p>
        )}
      </section>

      {/* Nivel 2 — Señal temprana */}
      {emergingCount > 0 && (
        <section id="senal-temprana" className="scroll-mt-6">
          <button
            type="button"
            onClick={() => setEmergingOpen((v) => !v)}
            className="flex w-full items-start justify-between gap-4 text-left group"
            aria-expanded={emergingOpen}
          >
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                Señal temprana
              </h2>
              <p className="text-[13px] text-gray-500 mt-1">
                {emergingCount} {emergingCount === 1 ? "marca" : "marcas"} con evidencia parcial —
                aún no listas para auditoría
              </p>
            </div>
            <span className="text-[13px] text-gray-400 shrink-0 mt-1">
              {emergingOpen ? "Ocultar ▾" : "Expandir ▸"}
            </span>
          </button>
          {emergingOpen && (
            <div className="mt-5">
              <CardGrid items={emergingItems} />
            </div>
          )}
        </section>
      )}

      {/* Nivel 3 — Todos los anunciantes (corpus completo) */}
      <section id="todos-los-anunciantes" className="scroll-mt-6 pt-2 border-t border-[#ececec]">
        <button
          type="button"
          onClick={() => setCorpusOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 text-left group mb-1"
          aria-expanded={corpusOpen}
        >
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
              Todos los anunciantes
            </h2>
            <p className="text-[13px] text-gray-500 mt-1">
              {totalCount} en el corpus — buscá tu marca o una competencia
            </p>
          </div>
          {!hasCorpusFilters && (
            <span className="text-[13px] text-gray-400 shrink-0 mt-1">
              {corpusOpen ? "Ocultar ▾" : "Explorar ▸"}
            </span>
          )}
        </button>

        {(corpusOpen || hasCorpusFilters) && (
          <div className="mt-4">
            <BrowseFilters
              query={corpusQuery}
              channel={corpusChannel}
              sort={corpusSort}
              channelOptions={channelOptions}
              onQuery={setCorpusQuery}
              onChannel={setCorpusChannel}
              onSort={setCorpusSort}
            />

            {corpusItems.length === 0 ? (
              <div className="card p-8 text-center text-[13.5px] text-gray-500">
                Ningún anunciante coincide con esta búsqueda.
              </div>
            ) : (
              <>
                <p className="text-[12.5px] text-gray-400 mb-4">
                  {corpusItems.length} de {totalCount} anunciantes
                  {hasCorpusFilters ? " con estos filtros" : ""}
                </p>
                <CardGrid items={corpusItems} />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
