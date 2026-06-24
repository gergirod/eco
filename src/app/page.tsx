import Link from "next/link";
import { PageHeader, Stat, Bar } from "@/components/ui";
import TopBrandsTable from "@/components/TopBrandsTable";
import { compact, num, usd } from "@/lib/format";
import { fetchDataset } from "@/lib/supabase";
import metaFb from "@/data/meta.json";
import channelsFb from "@/data/channels.json";
import benchmarkFb from "@/data/benchmark.json";
import reportsFb from "@/data/reports.json";

export const dynamic = "force-dynamic";

function ts(iso?: string) {
  return Date.parse(iso || "") || 0;
}

/** Supabase puede quedar stale; si el bundle local es más nuevo, gana el bundle. */
function bundleNewer(metaSb: any | null) {
  return !metaSb || ts(metaFb.exported_at) > ts(metaSb.exported_at);
}

export default async function Home() {
  const metaSb = await fetchDataset<any>("meta");
  const useBundle = bundleNewer(metaSb);
  const meta: any = useBundle ? metaFb : metaSb ?? metaFb;
  const channels: any[] = useBundle
    ? channelsFb
    : ((await fetchDataset("channels")) ?? channelsFb);
  const benchmark: any[] = useBundle
    ? benchmarkFb
    : ((await fetchDataset("benchmark")) ?? benchmarkFb);
  const reports: Record<string, any> = useBundle
    ? reportsFb
    : ((await fetchDataset("reports")) ?? reportsFb);

  const reportList = Object.entries(reports)
    .map(([slug, r]) => ({ slug, ...(r as object) }))
    .filter((r: any) => r.kind === "marca" || !r.kind);

  const withData = channels.filter((c: any) => c.has_data);
  const maxViews = Math.max(...benchmark.map((b: any) => b.vod_views), 1);
  const nPauta = meta.n_pauta_mentions ?? reportList.reduce((a, r) => a + r.mentions, 0);
  const totalExposure = reportList.reduce((a, r) => a + (r.value_usd || 0), 0);
  const topBrands = [...reportList]
    .sort((a, b) => b.mentions - a.mentions)
    .map((b: any) => ({
      slug: b.slug,
      name: b.name,
      mentions: b.mentions,
      value_usd: b.value_usd || 0,
    }));

  return (
    <div>
      <PageHeader
        title="Resumen"
        sub="Inteligencia de marca sobre el streaming argentino en vivo · datos reales del pipeline"
      />

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Stat label="Canales monitoreados" value={withData.length} hint={`${channels.length} en el universo`} />
        <Stat label="VODs procesados" value={num(meta.n_videos)} hint={`${meta.n_topics} en vivo con audiencia`} />
        <Stat
          label="PNT verificadas"
          value={num(nPauta)}
          hint={`${reportList.length} anunciantes · solo pauta`}
        />
        <Stat
          label="Exposición pauta"
          value={usd(totalExposure)}
          hint="lente A · audiencia al minuto"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Benchmark entre canales</h2>
            <Link href="/competencia" className="text-[12px] text-accent hover:underline">Ver detalle →</Link>
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
            Solo {withData.length} canal{withData.length !== 1 ? "es" : ""} tienen data procesada hoy
            ({withData.map((c: any) => c.name).join(", ")}). PNT = lecturas de pauta verificadas, no menciones
            orgánicas al pasar.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Top marcas por pauta</h2>
            <Link href="/marca" className="text-[12px] text-accent hover:underline">Reportes →</Link>
          </div>
          <TopBrandsTable brands={topBrands} />
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="text-[15px] font-semibold mb-1">Para qué sirve cada vista</h2>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          <Link href="/marca" className="text-accent font-medium">Reportes de marca</Link> — el entregable que
          vendés: PNT verificada, minuto exacto, concurrentes en vivo, cita textual, PDF.{" "}
          <Link href="/competencia" className="text-accent">Competencia</Link> y{" "}
          <Link href="/mediakit" className="text-accent">Media Kit</Link> — argumentos de venta (share of voice,
          social proof de anunciantes).{" "}
          <Link href="/audiencia" className="text-accent">Audiencia</Link> — defensa del CPM.{" "}
          <Link href="/productos" className="text-accent">Prospectos & research</Link> — quién pautó vs qué se
          nombra al aire.{" "}
          <Link href="/tendencias" className="text-accent">Radar</Link> — capa 2, diferencial futuro.{" "}
          <Link href="/backoffice" className="text-accent">Backoffice</Link> — operación interna del pipeline.
        </p>
      </div>
    </div>
  );
}
