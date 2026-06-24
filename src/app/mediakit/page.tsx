"use client";
import { useState, useMemo } from "react";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import { useDataset } from "@/lib/useDataset";
import { usd, num, compact } from "@/lib/format";
import channelsFb from "@/data/channels.json";
import benchmarkFb from "@/data/benchmark.json";
import metaFb from "@/data/meta.json";

export default function MediaKitPage() {
  const channels = useDataset<any[]>("channels", channelsFb);
  const benchmark = useDataset<any[]>("benchmark", benchmarkFb);
  const meta = useDataset<any>("meta", metaFb);
  const cpm = meta?.cpm || 30;

  const withData = useMemo(() => channels.filter((c) => c.stats), [channels]);
  const [cid, setCid] = useState("olga");
  const ch = withData.find((c) => c.id === cid) || withData[0];
  const b = benchmark.find((x) => x.id === ch.id);
  const totalViews = benchmark.reduce((a, x) => a + x.vod_views, 0) || 1;
  const shareV = b ? b.share_views : Math.round((1000 * (ch.stats.total_vod_views || 0)) / totalViews) / 10;
  // CPM defendible: valor de un minuto de PNT = audiencia concurrente / 1000 * CPM
  const minutoPNT = Math.round((ch.stats.avg_concurrent / 1000) * cpm);

  return (
    <div>
      <PageHeader
        title="Media Kit automático"
        sub="Lo que un canal necesita para vender pauta: audiencia real, CPM defendible, marcas que ya pautaron y benchmark vs la competencia."
      />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {withData.map((c) => (
          <button
            key={c.id}
            onClick={() => setCid(c.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] border transition ${
              c.id === ch.id ? "bg-accent-soft border-accent text-accent font-medium" : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
        <span className="text-[12px] text-gray-400 ml-auto">CPM de referencia: USD {cpm} · vivo</span>
      </div>

      {/* encabezado del canal */}
      <div className="card p-5 mb-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-semibold">{ch.name}</h2>
            <div className="text-[13px] text-gray-500 mt-0.5">
              {ch.genre} · {ch.subscribers} suscriptores · {ch.stats.videos_processed} programas analizados
            </div>
          </div>
          <Badge tone="blue">{shareV}% share of views del segmento</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Audiencia concurrente prom." value={num(ch.stats.avg_concurrent)} hint="en vivo, al minuto" />
        <Stat label="Views VOD acumuladas" value={compact(ch.stats.total_vod_views)} hint="cola de largo plazo" />
        <Stat label="Valor de un minuto PNT" value={usd(minutoPNT)} hint={`audiencia ÷ 1k × CPM ${cpm}`} />
        <Stat label="Marcas detectadas" value={num(ch.stats.brands_detected)} hint="universo de anunciantes" />
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {/* social proof: marcas que ya aparecieron */}
        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-1">Marcas que ya aparecieron</h3>
          <p className="text-[12px] text-gray-400 mb-3">Social proof: anunciantes presentes en el canal.</p>
          <div className="flex flex-wrap gap-2">
            {(b?.top_brands || []).map((br: string, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 text-[12.5px] text-gray-700">
                {br}
              </span>
            ))}
          </div>
        </div>

        {/* benchmark vs competencia */}
        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Benchmark vs competencia</h3>
          <div className="flex flex-col gap-3">
            {benchmark.map((x) => {
              const max = Math.max(...benchmark.map((y) => y.avg_concurrent), 1);
              const me = x.id === ch.id;
              return (
                <div key={x.id}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className={me ? "font-semibold text-accent" : "text-gray-600"}>{x.name}</span>
                    <span className="text-gray-400 tabular-nums">{num(x.avg_concurrent)} conc.</span>
                  </div>
                  <Bar value={x.avg_concurrent} max={max} tone={me ? "#2f5fe0" : "#cbd2dd"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        En lugar de screenshots de YouTube Studio, el media kit se arma solo desde la data del pipeline:
        audiencia concurrente real por programa, CPM defendible (no AVE), marcas previas como prueba
        social y comparación contra la competencia directa. Valor de un minuto PNT = audiencia
        concurrente ÷ 1.000 × CPM. Benchmark de exposición, no facturación.
      </p>
    </div>
  );
}
