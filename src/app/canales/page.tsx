"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CoverageLine from "@/components/CoverageLine";
import { getPlatformCoverage, loadDiscoveryDataset } from "@/lib/discovery";
import { listChannelBrowseItems } from "@/lib/channelProfile";
import { useDataset } from "@/lib/useDataset";
import { compact, num } from "@/lib/format";
import type { ChannelBrowseItem } from "@/lib/channelProfile";
import audienceFb from "@/data/audience.json";
import benchmarkFb from "@/data/benchmark.json";
import channelsFb from "@/data/channels.json";

function CanalesListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const audience = useDataset("audience", audienceFb);
  const benchmark = useDataset("benchmark", benchmarkFb);
  const channelsConfig = useDataset("channels", channelsFb);
  const coverage = useMemo(() => getPlatformCoverage(loadDiscoveryDataset()), []);

  const items = useMemo(
    () =>
      listChannelBrowseItems(
        channelsConfig as Parameters<typeof listChannelBrowseItems>[0],
        audience as Parameters<typeof listChannelBrowseItems>[1],
        benchmark as Parameters<typeof listChannelBrowseItems>[2]
      ),
    [channelsConfig, audience, benchmark]
  );

  const withCapture = items.filter((c) => c.hasCapture);
  const withoutCapture = items.filter((c) => !c.hasCapture);

  const heroLine = useMemo(() => {
    if (!withCapture.length) return "¿Qué sabemos sobre cada canal del streaming capturado?";
    const byAudience = [...withCapture].sort(
      (a, b) => (b.avgConcurrent ?? 0) - (a.avgConcurrent ?? 0)
    );
    const byBrands = [...withCapture].sort((a, b) => b.brands - a.brands);
    const topAud = byAudience[0]?.name;
    const topBrands = byBrands[0]?.name;
    if (topAud && topBrands && topAud !== topBrands) {
      return `${topAud} concentra la audiencia; ${topBrands} concentra marcas con pauta.`;
    }
    if (topAud) return `${topAud} lidera audiencia y actividad comercial en el período.`;
    return "Investigá cada canal en profundidad — audiencia, marcas y programas.";
  }, [withCapture]);

  useEffect(() => {
    const ch = searchParams.get("channel");
    if (ch) router.replace(`/canales/${ch}`);
  }, [searchParams, router]);

  function channelSubtitle(
    ch: ChannelBrowseItem,
    isTopAudience: boolean,
    isTopBrands: boolean
  ): string {
    const aud =
      ch.avgConcurrent != null && ch.avgConcurrent > 0
        ? `promedio ${num(ch.avgConcurrent)} mirando${
            ch.peakConcurrent ? `, pico ${compact(ch.peakConcurrent)}` : ""
          }`
        : null;

    if (isTopAudience && isTopBrands) {
      return aud
        ? `Mayor audiencia y más marcas activas — ${aud}.`
        : "Mayor audiencia y más marcas activas en el período.";
    }
    if (isTopAudience) {
      return aud ? `Mayor audiencia del período — ${aud}.` : "Mayor audiencia del período.";
    }
    if (isTopBrands) {
      const commercial = `Más marcas con pauta — ${ch.brands} activas, ${ch.mentions} apariciones`;
      return aud ? `${commercial} · ${aud}.` : `${commercial}.`;
    }
    return aud
      ? `${ch.mentions} apariciones · ${ch.brands} marcas · ${aud}.`
      : `${ch.mentions} apariciones · ${ch.brands} marcas.`;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight max-w-2xl">
        {heroLine}
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 max-w-xl">
        ¿Qué sabemos sobre este canal? Elegí uno para ver programas, marcas activas, audiencia y
        comparaciones.
      </p>
      <CoverageLine coverage={coverage} />

      <div className="flex flex-col gap-4">
        {withCapture.map((ch, index) => {
          const isTopAudience = index === 0 && (ch.avgConcurrent ?? 0) > 0;
          const isTopBrands =
            ch.brands >= Math.max(...withCapture.map((c) => c.brands), 0) && ch.brands > 0;

          return (
            <Link
              key={ch.id}
              href={`/canales/${ch.id}`}
              className="card p-5 sm:p-6 block hover:border-accent/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-ink group-hover:text-accent transition-colors">
                    {ch.name}
                  </h2>
                  <p className="text-[13.5px] text-gray-600 mt-1.5 leading-relaxed max-w-xl">
                    {channelSubtitle(ch, isTopAudience, isTopBrands)}
                  </p>
                  {ch.topBrandName && (
                    <p className="text-[12.5px] text-gray-400 mt-2">
                      Marca destacada · {ch.topBrandName}
                      {ch.shareViews != null ? ` · ${ch.shareViews}% de reproducciones capturadas` : ""}
                    </p>
                  )}
                </div>
                <span className="text-[12.5px] text-accent font-medium shrink-0 group-hover:underline">
                  Ver perfil →
                </span>
              </div>
            </Link>
          );
        })}

        {withoutCapture.length > 0 && (
          <div className="pt-4">
            <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">
              Sin captura en el período
            </p>
            <div className="flex flex-col gap-2">
              {withoutCapture.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/canales/${ch.id}`}
                  className="text-[13.5px] text-gray-500 hover:text-accent py-1"
                >
                  {ch.name} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-xl">
        Solo emisiones capturadas en el período — no es el catálogo completo del canal. Audiencia
        concurrente medida minuto a minuto durante el vivo.
      </p>
    </div>
  );
}

export default function CanalesPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400">Cargando canales…</div>}>
      <CanalesListInner />
    </Suspense>
  );
}
