import Link from "next/link";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import { compact, num, usd } from "@/lib/format";
import { fetchDataset } from "@/lib/supabase";
import metaFb from "@/data/meta.json";
import channelsFb from "@/data/channels.json";
import brandsFb from "@/data/brands.json";
import benchmarkFb from "@/data/benchmark.json";

export const dynamic = "force-dynamic";

export default async function Home() {
  const meta: any = (await fetchDataset("meta")) ?? metaFb;
  const channels: any[] = (await fetchDataset("channels")) ?? channelsFb;
  const brands: any[] = (await fetchDataset("brands")) ?? brandsFb;
  const benchmark: any[] = (await fetchDataset("benchmark")) ?? benchmarkFb;
  const withData = channels.filter((c: any) => c.has_data);
  const maxViews = Math.max(...benchmark.map((b: any) => b.vod_views), 1);
  const topBrands = brands.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Resumen"
        sub="Inteligencia de marca sobre el streaming argentino en vivo · datos reales del pipeline"
      />

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Stat label="Canales monitoreados" value={withData.length} hint={`${channels.length} en el universo`} />
        <Stat label="VODs procesados" value={num(meta.n_videos)} hint={`${meta.n_topics} con extracción`} />
        <Stat label="Marcas detectadas" value={num(meta.n_brands)} hint={`${meta.n_products} productos`} />
        <Stat label="Valor de referencia" value={usd(brands.reduce((a: number, b: any) => a + b.value_usd, 0))} hint="lente CPM, benchmark" />
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
                  <span className="text-gray-400 tabular-nums">{compact(b.vod_views)} views · {b.brands} marcas</span>
                </div>
                <Bar value={b.vod_views} max={maxViews} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Solo {withData.length} canales tienen data procesada hoy (Olga, Luzu). El resto del universo está
            configurado y listo para activar desde el backoffice.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Marcas más nombradas</h2>
            <Link href="/productos" className="text-[12px] text-accent hover:underline">Catálogo →</Link>
          </div>
          <table>
            <tbody>
              {topBrands.map((b: any) => (
                <tr key={b.slug}>
                  <td className="font-medium">{b.name}</td>
                  <td className="text-gray-400 text-right tabular-nums">{b.mentions} menciones</td>
                  <td className="text-right"><Badge tone="blue">{usd(b.value_usd)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="text-[15px] font-semibold mb-1">Cómo está pensado este demo</h2>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          <Link href="/backoffice" className="text-accent">Backoffice</Link> es la vista interna: elegís canales,
          disparás el run y ves el estado del proceso y quién está en vivo ahora.{" "}
          <Link href="/marca" className="text-accent">Dashboard de marca</Link> es lo que ve el cliente (modo agencia,
          varias marcas): sus menciones por stream y la valorización.{" "}
          <Link href="/competencia" className="text-accent">Competencia</Link> compara su marca contra competidores, y{" "}
          <Link href="/productos" className="text-accent">Catálogo</Link> es el universo acumulado de marcas para elegir
          a quién seguir.
        </p>
      </div>
    </div>
  );
}
