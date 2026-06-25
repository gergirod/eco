"use client";
import { useMemo } from "react";
import Link from "next/link";
import CoverageLine from "@/components/CoverageLine";
import { useDataset } from "@/lib/useDataset";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import { compact, num } from "@/lib/format";
import audienceFb from "@/data/audience.json";
import benchmarkFb from "@/data/benchmark.json";
import channelsFb from "@/data/channels.json";

type ChannelConfig = {
  id: string;
  name: string;
  enabled: boolean;
  has_data: boolean;
};

function shortProgramTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 72) return t;
  return `${t.slice(0, 69).trimEnd()}…`;
}

export default function CanalesPage() {
  const audience = useDataset<any[]>("audience", audienceFb);
  const benchmark = useDataset<any[]>("benchmark", benchmarkFb);
  const channelsConfig = useDataset<ChannelConfig[]>("channels", channelsFb);
  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);

  const audienceById = useMemo(
    () => Object.fromEntries(audience.map((a) => [a.id, a])),
    [audience]
  );
  const benchmarkById = useMemo(
    () => Object.fromEntries(benchmark.map((b) => [b.id, b])),
    [benchmark]
  );

  const heroLine = useMemo(() => {
    if (!audience.length) return "Compará dónde está la atención y la actividad comercial.";
    const byAudience = [...audience].sort((a, b) => b.avg_concurrent - a.avg_concurrent);
    const byBrands = [...benchmark].sort((a, b) => (b.brands || 0) - (a.brands || 0));
    const topAud = byAudience[0]?.name;
    const topBrands = byBrands[0]?.name;
    if (topAud && topBrands && topAud !== topBrands) {
      return `${topAud} concentra la audiencia; ${topBrands} concentra marcas con pauta.`;
    }
    if (topAud) return `${topAud} lidera audiencia y actividad comercial en el período.`;
    return "Compará dónde está la atención y la actividad comercial.";
  }, [audience, benchmark]);

  const enabledNoData = useMemo(
    () =>
      channelsConfig.filter((c) => c.enabled && !c.has_data && !audienceById[c.id]),
    [channelsConfig, audienceById]
  );

  const topBrandsByChannel = useMemo(() => {
    const map: Record<string, { slug: string; name: string; mentions: number }[]> = {};
    for (const ch of benchmark) {
      map[ch.id] = (ch.top_brands || []).slice(0, 5);
    }
    return map;
  }, [benchmark]);

  const sortedAudience = useMemo(
    () => [...audience].sort((a, b) => b.avg_concurrent - a.avg_concurrent),
    [audience]
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight max-w-2xl">
        {heroLine}
      </h1>
      <CoverageLine coverage={coverage} />

      <div className="flex flex-col gap-5">
        {sortedAudience.map((a, index) => {
          const brands = topBrandsByChannel[a.id] || [];
          const topProgram = a.top_programs?.[0];
          const isTopAudience = index === 0;
          const isTopBrands =
            (benchmarkById[a.id]?.brands || 0) >=
            Math.max(...benchmark.map((b) => b.brands || 0), 0);

          return (
            <article key={a.id} className="card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-ink">{a.name}</h2>
                  <p className="text-[13.5px] text-gray-600 mt-1.5 leading-relaxed max-w-xl">
                    {isTopAudience && isTopBrands
                      ? `Mayor audiencia y más marcas activas del período — promedio ${num(a.avg_concurrent)} mirando, pico ${compact(a.peak_concurrent)}.`
                      : isTopAudience
                        ? `Mayor audiencia del período — promedio ${num(a.avg_concurrent)} mirando, pico ${compact(a.peak_concurrent)}.`
                        : isTopBrands
                          ? `Más marcas con pauta del período — promedio ${num(a.avg_concurrent)} mirando.`
                          : `${a.videos} programas capturados — promedio ${num(a.avg_concurrent)} mirando, pico ${compact(a.peak_concurrent)}.`}
                  </p>
                </div>
                <Link
                  href={`/marcas?channel=${a.id}`}
                  className="text-[12.5px] text-accent font-medium hover:underline shrink-0"
                >
                  Ver marcas activas →
                </Link>
              </div>

              {topProgram && (
                <p className="text-[13px] text-gray-500 mb-4">
                  Programa con mayor pico ·{" "}
                  <span className="text-gray-700">{shortProgramTitle(topProgram.title || "")}</span>
                  {" · "}
                  <span className="font-medium text-ink">{compact(topProgram.peak)} mirando</span>
                </p>
              )}

              {brands.length > 0 && (
                <div className="border-t border-[#f0f0f0] pt-3">
                  <div className="text-[12px] font-medium text-gray-500 mb-2">Marcas más activas</div>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/marcas/${b.slug}`}
                        className="text-[12.5px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 hover:bg-accent-soft hover:text-accent"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {enabledNoData.length > 0 && (
          <div className="text-[13px] text-gray-500 pt-2">
            {enabledNoData.map((c) => c.name).join(" · ")} — sin captura en el período actual
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Audiencia concurrente medida minuto a minuto durante el vivo. Solo emisiones capturadas en
        el período — no es el catálogo completo del canal.
      </p>
    </div>
  );
}
