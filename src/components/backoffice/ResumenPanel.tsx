"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Stat, Bar } from "@/components/ui";
import TopBrandsTable from "@/components/TopBrandsTable";
import ValuationNotice from "@/components/ValuationNotice";
import { compact, num } from "@/lib/format";
import { VALUATION_HINT, VALUATION_INFO, usdEstSum } from "@/lib/valuation";
import { useDataset } from "@/lib/useDataset";
import metaFb from "@/data/meta.json";
import channelsFb from "@/data/channels.json";
import benchmarkFb from "@/data/benchmark.json";
import reportsFb from "@/data/reports.json";

export default function ResumenPanel() {
  const meta: any = useDataset("meta", metaFb);
  const channels: any[] = useDataset("channels", channelsFb);
  const benchmark: any[] = useDataset("benchmark", benchmarkFb);
  const reports: Record<string, any> = useDataset("reports", reportsFb);

  const reportList = useMemo(
    () =>
      Object.entries(reports)
        .map(([slug, r]) => ({ slug, ...(r as object) }))
        .filter((r: any) => r.kind === "marca" || !r.kind),
    [reports]
  );

  const withData = channels.filter((c: any) => c.has_data);
  const maxViews = Math.max(...benchmark.map((b: any) => b.vod_views), 1);
  const nPauta = meta.n_pauta_mentions ?? reportList.reduce((a, r) => a + r.mentions, 0);
  const exposureValues = reportList.map((r: any) => r.value_usd || 0);
  const topBrands = useMemo(
    () =>
      [...reportList]
        .sort((a, b) => b.mentions - a.mentions)
        .map((b: any) => ({
          slug: b.slug,
          name: b.name,
          mentions: b.mentions,
          value_usd: b.value_usd || 0,
        })),
    [reportList]
  );

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <Stat label="Canales monitoreados" value={withData.length} hint={`${channels.length} en el universo`} />
        <Stat label="VODs procesados" value={num(meta.n_videos)} hint={`${meta.n_topics} en vivo con audiencia`} />
        <Stat
          label="PNT verificadas"
          value={num(nPauta)}
          hint={`${reportList.length} anunciantes · solo pauta`}
        />
        <Stat
          label="Exposición estimada"
          value={usdEstSum(exposureValues)}
          hint={VALUATION_HINT}
          info={VALUATION_INFO}
        />
      </div>

      <div className="mb-5">
        <ValuationNotice compact />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Benchmark entre canales</h2>
            <Link href="/competencia" className="text-[12px] text-accent hover:underline">
              Ver detalle →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {benchmark.map((b: any) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-[13px] mb-1">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-gray-400 tabular-nums">
                    {compact(b.vod_views)} views · {b.mentions} PNT · {b.n_brands_live ?? b.brands} marcas
                  </span>
                </div>
                <Bar value={b.vod_views} max={maxViews} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Solo {withData.length} canal{withData.length !== 1 ? "es" : ""} tienen data procesada hoy (
            {withData.map((c: any) => c.name).join(", ")}). PNT = lecturas de pauta verificadas, no menciones
            orgánicas al pasar.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Top marcas por pauta</h2>
            <Link href="/marca" className="text-[12px] text-accent hover:underline">
              Reportes →
            </Link>
          </div>
          <TopBrandsTable brands={topBrands} />
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="text-[15px] font-semibold mb-1">Vistas del producto (acceso directo)</h2>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          <Link href="/discover" className="text-accent font-medium">
            Discovery
          </Link>{" "}
          — experiencia principal del producto.{" "}
          <Link href="/campaign" className="text-accent font-medium">
            Campaign Intelligence
          </Link>{" "}
          — auditoría de campaña.{" "}
          <Link href="/marca" className="text-accent">
            Reportes de marca
          </Link>
          ,{" "}
          <Link href="/competencia" className="text-accent">
            Competencia
          </Link>
          ,{" "}
          <Link href="/mediakit" className="text-accent">
            Media Kit
          </Link>
          ,{" "}
          <Link href="/audiencia" className="text-accent">
            Audiencia
          </Link>
          ,{" "}
          <Link href="/productos" className="text-accent">
            Prospectos & research
          </Link>
          ,{" "}
          <Link href="/tendencias" className="text-accent">
            Radar
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
