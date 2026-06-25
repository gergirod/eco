"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdvertiserBrowseCard from "@/components/discovery/AdvertiserBrowseCard";
import {
  browseAdvertisers,
  countByTier,
  type DiscoveryDataset,
  type DiscoverySortKey,
} from "@/lib/discovery";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

type AdvertiserBrowseProps = {
  dataset: DiscoveryDataset;
  /** Slugs already shown in the hero preview — excluded from this grid. */
  excludeSlugs?: string[];
};

export default function AdvertiserBrowse({ dataset, excludeSlugs = [] }: AdvertiserBrowseProps) {
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialChannel = searchParams.get("channel") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [channel, setChannel] = useState(initialChannel);
  const [sort, setSort] = useState<DiscoverySortKey>("peak_conc_at");
  const [emergingOpen, setEmergingOpen] = useState(false);

  const excluded = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);

  const channelOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const a of dataset.advertisers) {
      if (a.confidenceTier === "high_confidence" || a.confidenceTier === "emerging_confidence") {
        a.channels.forEach((c) => ids.add(c));
      }
    }
    return [...ids].sort((a, b) => (CH_NAME[a] || a).localeCompare(CH_NAME[b] || b));
  }, [dataset]);

  const primaryItems = useMemo(() => {
    const items = browseAdvertisers(dataset, {
      tiers: ["high_confidence"],
      query,
      channel,
      sort,
    });
    if (!excludeSlugs.length || query || channel) return items;
    return items.filter((item) => !excluded.has(item.slug));
  }, [dataset, query, channel, sort, excludeSlugs, excluded]);

  const emergingItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ["emerging_confidence"],
        query,
        channel,
        sort,
      }),
    [dataset, query, channel, sort]
  );

  const emergingCount =
    dataset.meta.emergingConfidenceAdvertisers || countByTier(dataset, "emerging_confidence");

  const showFilters = primaryItems.length > 0 || query || channel;

  return (
    <div>
      <section id="todos-los-anunciantes" className="scroll-mt-6">
        {excludeSlugs.length > 0 && !query && !channel && (
          <h2 className="text-[16px] font-semibold text-ink mb-5 tracking-tight">
            Más anunciantes para investigar
          </h2>
        )}

        {(showFilters || emergingCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar anunciante…"
              className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-accent w-[200px]"
              aria-label="Buscar anunciante"
            />
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
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
              onChange={(e) => setSort(e.target.value as DiscoverySortKey)}
              className="border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] outline-none focus:border-accent bg-white"
              aria-label="Ordenar lista"
            >
              <option value="peak_conc_at">Mayor audiencia</option>
              <option value="last_seen">Más recientes</option>
            </select>
          </div>
        )}

        {primaryItems.length === 0 ? (
          !query && !channel && excludeSlugs.length > 0 ? null : (
            <div className="card p-8 text-center text-[13.5px] text-gray-500">
              Ningún anunciante coincide con estos filtros.
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {primaryItems.map((item) => (
              <AdvertiserBrowseCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </section>

      {emergingCount > 0 && (
        <section className="mt-10">
          <button
            type="button"
            onClick={() => setEmergingOpen((v) => !v)}
            className="flex items-center gap-2 text-[13px] font-medium text-gray-600 hover:text-accent"
            aria-expanded={emergingOpen}
          >
            <span className="text-[11px]" aria-hidden>
              {emergingOpen ? "▾" : "▸"}
            </span>
            Señal temprana — {emergingCount}{" "}
            {emergingCount === 1 ? "marca" : "marcas"} con evidencia parcial
          </button>
          {emergingOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {emergingItems.map((item) => (
                <AdvertiserBrowseCard key={item.slug} item={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
