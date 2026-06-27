"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ConversacionRow from "@/components/conversacion/ConversacionRow";
import CoverageLine from "@/components/CoverageLine";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import {
  buildConversacionRanking,
  conversacionSubline,
  filterConversacionTopics,
  getConversacionCategories,
  sortConversacionTopics,
  type ConversacionMomentum,
  type ConversacionSort,
} from "@/lib/conversacion";
import GoogleTrendsControl from "@/components/googleTrends/GoogleTrendsControl";
import {
  countRadarGtInteresting,
  countRadarWithGt,
} from "@/lib/googleTrends";
import { useDataset } from "@/lib/useDataset";
import metaFb from "@/data/meta.json";
import radarFb from "@/data/radar.json";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { id: ConversacionSort; label: string }[] = [
  { id: "relevancia", label: "Relevancia" },
  { id: "menciones", label: "Más menciones" },
  { id: "canales", label: "Más canales" },
  { id: "crecimiento", label: "Más crecimiento" },
  { id: "az", label: "A → Z" },
];

const MOMENTUM_OPTIONS: { id: ConversacionMomentum | ""; label: string }[] = [
  { id: "", label: "Cualquier ritmo" },
  { id: "sube", label: "Sube" },
  { id: "baja", label: "Baja" },
  { id: "estable", label: "Estable" },
  { id: "nuevo", label: "Reciente" },
];

export default function ConversacionPage() {
  const [withGoogleTrends, setWithGoogleTrends] = useState(false);
  const radar = useDataset("radar", radarFb);
  const meta = useDataset("meta", metaFb);
  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);
  const [crossOnly, setCrossOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [momentum, setMomentum] = useState<ConversacionMomentum | "">("");
  const [sortBy, setSortBy] = useState<ConversacionSort>("relevancia");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () =>
      buildConversacionRanking(radar as Parameters<typeof buildConversacionRanking>[0], {
        crossOnly,
      }),
    [radar, crossOnly]
  );

  const totalTopicCount = useMemo(
    () =>
      buildConversacionRanking(radar as Parameters<typeof buildConversacionRanking>[0], {
        crossOnly: false,
      }).length,
    [radar]
  );

  const categories = useMemo(() => getConversacionCategories(pool), [pool]);

  const filtered = useMemo(() => {
    const narrowed = filterConversacionTopics(pool, { search, categoria, momentum });
    return sortConversacionTopics(narrowed, sortBy);
  }, [pool, search, categoria, momentum, sortBy]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [crossOnly, search, categoria, momentum, sortBy]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "240px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, filtered.length]);

  const subline = conversacionSubline(visible, crossOnly, meta as Parameters<typeof conversacionSubline>[2], {
    totalAvailable: filtered.length,
    showing: visible.length,
  });

  const filtersActive = Boolean(search.trim() || categoria || momentum);

  const gtEnriched = useMemo(
    () => countRadarWithGt(radar as { gt_status?: string | null }[]),
    [radar]
  );
  const gtInteresting = useMemo(
    () => countRadarGtInteresting(radar as { gt_status?: string | null }[]),
    [radar]
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
        ¿De qué se habla en el streaming?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl">
        Ranking de lo que charlan los conductores en los streams que seguimos — no es marcas
        pautando ni lo que pide la sala. Un tema fuerte acá es señal de contenido, no de
        publicidad.
      </p>
      <CoverageLine coverage={coverage} />
      <p className="text-[12.5px] text-gray-400 mb-4">{subline}</p>

      <GoogleTrendsControl
        enabled={withGoogleTrends}
        onChange={setWithGoogleTrends}
        enrichedCount={gtEnriched}
        interestingCount={gtInteresting}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setCrossOnly(true)}
          className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
            crossOnly
              ? "bg-ink text-white border-ink"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          Varios streams (recomendado)
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
          Todos los temas ({totalTopicCount})
        </button>
      </div>

      <div className="card p-3 sm:p-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tema, canal o categoría…"
            className="flex-1 px-3 py-2 text-[13px] border border-[#ececec] rounded-lg"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ConversacionSort)}
            className="px-3 py-2 text-[13px] border border-[#ececec] rounded-lg bg-white min-w-[160px]"
            aria-label="Ordenar por"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                Orden: {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-1.5 text-[12px] border border-[#ececec] rounded-lg bg-white"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={momentum}
            onChange={(e) => setMomentum(e.target.value as ConversacionMomentum | "")}
            className="px-3 py-1.5 text-[12px] border border-[#ececec] rounded-lg bg-white"
            aria-label="Filtrar por ritmo"
          >
            {MOMENTUM_OPTIONS.map((opt) => (
              <option key={opt.id || "all"} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoria("");
                setMomentum("");
              }}
              className="text-[12px] px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
        {pool.length > PAGE_SIZE ? (
          <p className="text-[11.5px] text-gray-400">
            Hay {pool.length} temas en esta vista — mostramos de a {PAGE_SIZE}. Bajá o tocá ver más.
          </p>
        ) : null}
      </div>

      <div className="card p-4 mb-6 bg-gray-50/80 border-[#ececec] text-[12.5px] text-gray-600 leading-relaxed space-y-2">
        <p>
          <b className="text-gray-700">Esto no es Tendencias.</b> Acá ves qué temas dominan la
          charla. En{" "}
          <Link href="/tendencias" className="text-accent font-medium hover:underline">
            Tendencias
          </Link>{" "}
          ves lecturas de mercado (cambios, oportunidades, patrones combinados).
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

      {filtered.length === 0 ? (
        <div className="card p-8 text-[14px] text-gray-600 leading-relaxed">
          <p>
            {filtersActive ? (
              <>
                Nada coincide con esos filtros.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoria("");
                    setMomentum("");
                  }}
                  className="text-accent font-medium hover:underline"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                Todavía no hay temas que crucen 2+ canales con buen respaldo. Probá{" "}
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
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((topic) => (
              <ConversacionRow
                key={topic.tema}
                topic={topic}
                showGoogleTrends={withGoogleTrends}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))}
                className="btn border border-[#ececec] text-[13px]"
              >
                Ver más ({filtered.length - visibleCount} restantes)
              </button>
              <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
            </div>
          ) : filtered.length > PAGE_SIZE ? (
            <p className="text-[12px] text-gray-400 text-center mt-6">
              Mostraste los {filtered.length} temas de esta vista.
            </p>
          ) : null}
        </>
      )}

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Ordenamos por charla relevante: volumen, crecimiento, si aparece en varios streams y pedidos en el chat.
        Citas sacadas del audio. Con cobertura amplia, pedimos 3+ canales. Temas parecidos (p. ej. mundial*)
        se agrupan en una sola entrada.
      </p>
    </div>
  );
}
