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
  /** Slugs already shown in the hero preview — excluded from expanded list. */
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
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Buscar mi marca o una competencia…"
        className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-accent w-full sm:w-[260px]"
        aria-label="Buscar marca"
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
        <option value="peak_conc_at">Mayor atención medida</option>
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

  const [query, setQuery] = useState(initialQ);
  const [channel, setChannel] = useState(initialChannel);
  const [sort, setSort] = useState<DiscoverySortKey>("peak_conc_at");
  const [expanded, setExpanded] = useState(Boolean(initialQ || initialChannel));

  const excluded = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);

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

  const moreHighConfidence = useMemo(() => {
    const items = browseAdvertisers(dataset, {
      tiers: ["high_confidence"],
      sort: "peak_conc_at",
    });
    return items.filter((item) => !excluded.has(item.slug));
  }, [dataset, excluded]);

  const emergingItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ["emerging_confidence"],
        sort: "last_seen",
      }),
    [dataset]
  );

  const filteredItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ALL_TIERS,
        query,
        channel,
        sort,
      }),
    [dataset, query, channel, sort]
  );

  const hasFilters = Boolean(query.trim() || channel);
  const showExpanded = expanded || hasFilters;

  const moreCount =
    moreHighConfidence.length + emergingItems.length + countByTier(dataset, "detected");

  return (
    <section className="mt-2">
      <BrowseFilters
        query={query}
        channel={channel}
        sort={sort}
        channelOptions={channelOptions}
        onQuery={setQuery}
        onChannel={setChannel}
        onSort={setSort}
      />

      {!showExpanded && !hasFilters && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 text-[13.5px] text-accent font-medium hover:underline"
        >
          Ver más marcas ({moreCount} en el período) →
        </button>
      )}

      {showExpanded && (
        <div className="mt-6 space-y-10">
          {hasFilters ? (
            <>
              {filteredItems.length === 0 ? (
                <div className="card p-8 text-center text-[13.5px] text-gray-500">
                  Ninguna marca coincide con esta búsqueda.
                </div>
              ) : (
                <>
                  <p className="text-[12.5px] text-gray-400">
                    {filteredItems.length} de {totalCount} marcas
                  </p>
                  <CardGrid items={filteredItems} />
                </>
              )}
            </>
          ) : (
            <>
              {moreHighConfidence.length > 0 && (
                <div>
                  <h2 className="text-[15px] font-semibold text-ink mb-4">Más marcas con actividad sólida</h2>
                  <CardGrid items={moreHighConfidence} />
                </div>
              )}

              {emergingCount > 0 && (
                <div>
                  <h2 className="text-[15px] font-semibold text-ink mb-1">Señal temprana</h2>
                  <p className="text-[13px] text-gray-500 mb-4">
                    {emergingCount} {emergingCount === 1 ? "marca" : "marcas"} con respaldo parcial
                    — aún no listas para auditoría
                  </p>
                  <CardGrid items={emergingItems} />
                </div>
              )}

              <div>
                <h2 className="text-[15px] font-semibold text-ink mb-1">Todas las marcas</h2>
                <p className="text-[13px] text-gray-500 mb-4">
                  {totalCount} en el período — usá los filtros de arriba para encontrar la tuya
                </p>
                <CardGrid items={filteredItems} />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
