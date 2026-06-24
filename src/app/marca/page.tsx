"use client";
import { useState, useMemo } from "react";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import { usd, num, compact } from "@/lib/format";
import { useDataset } from "@/lib/useDataset";
import reportsFb from "@/data/reports.json";
import channelsFb from "@/data/channels.json";

function tsLink(videoId: string, minute: string) {
  const [m, s] = minute.split(":").map(Number);
  const t = (m || 0) * 60 + (s || 0);
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`;
}

export default function MarcaDashboard() {
  const reports = useDataset<any>("reports", reportsFb);
  const channels = useDataset<any[]>("channels", channelsFb);
  const CH_NAME: Record<string, string> = useMemo(
    () => Object.fromEntries(channels.map((c: any) => [c.id, c.name])),
    [channels]
  );
  const options = useMemo(
    () =>
      Object.entries(reports as any)
        .map(([slug, r]: any) => ({ slug, name: r.name, mentions: r.mentions }))
        .sort((a, b) => b.mentions - a.mentions),
    [reports]
  );
  // marcas "de la agencia" sugeridas (pauta probable)
  const [brand, setBrand] = useState("mercado-libre");
  const r: any = (reports as any)[brand] || (reports as any)[options[0].slug];

  const byChannel = useMemo(() => {
    const m: Record<string, { mentions: number; value: number }> = {};
    r.detail.forEach((d: any) => {
      m[d.channel] = m[d.channel] || { mentions: 0, value: 0 };
      m[d.channel].mentions++;
      m[d.channel].value += d.value_usd;
    });
    return Object.entries(m).sort((a, b) => b[1].mentions - a[1].mentions);
  }, [r]);

  const maxCh = Math.max(...byChannel.map(([, v]) => v.mentions), 1);
  const programs = new Set(r.detail.map((d: any) => d.video_id)).size;
  const reach = r.detail.reduce((a: number, d: any) => a + d.views, 0);

  return (
    <div>
      <PageHeader title="Dashboard de marca" sub="Vista del cliente · modo agencia. Elegí la marca que pautás y mirá dónde apareció." />

      <div className="flex items-center gap-3 mb-6">
        <BrandPicker options={options} value={brand} onChange={setBrand} />
        <span className="text-[12px] text-gray-400">
          {options.length} marcas con menciones · modo agencia (varias marcas)
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Menciones" value={num(r.mentions)} hint={`en ${programs} programas`} />
        <Stat label="Canales" value={r.channels.length} hint="streams con aparición" />
        <Stat label="Alcance VOD" value={compact(reach)} hint="views acumuladas" />
        <Stat label="Valor de referencia" value={usd(r.value_usd)} hint="lente CPM, benchmark" />
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-5">
        <div className="card p-5 h-fit">
          <h2 className="text-[15px] font-semibold mb-4">Por stream</h2>
          <div className="flex flex-col gap-3.5">
            {byChannel.map(([cid, v]) => (
              <div key={cid}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium">{CH_NAME[cid] || cid}</span>
                  <span className="text-gray-400 tabular-nums">{v.mentions}</span>
                </div>
                <Bar value={v.mentions} max={maxCh} />
                <div className="text-[11px] text-gray-400 mt-0.5">{usd(v.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#ececec] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Menciones · {r.name}</h2>
            <Badge tone="gray">{r.detail.length} registros</Badge>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table>
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th>Fecha</th>
                  <th>Canal</th>
                  <th>Programa</th>
                  <th>Min</th>
                  <th className="text-right">Views</th>
                  <th className="text-right">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {r.detail.map((d: any, i: number) => (
                  <tr key={i}>
                    <td className="text-gray-500 whitespace-nowrap">{d.date}</td>
                    <td>{CH_NAME[d.channel] || d.channel_name}</td>
                    <td className="max-w-[280px] truncate" title={d.title}>{d.title}</td>
                    <td className="tabular-nums text-gray-500">{d.minute}</td>
                    <td className="text-right tabular-nums">{compact(d.views)}</td>
                    <td className="text-right tabular-nums text-gray-500">{usd(d.value_usd)}</td>
                    <td>
                      <a href={tsLink(d.video_id, d.minute)} target="_blank" rel="noreferrer" className="text-accent text-[12px] hover:underline">
                        ver ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[760px]">
        Valor de referencia = lente CPM (audiencia × CPM × peso de prominencia), según MODELO-VALORIZACION. Es un
        benchmark de exposición earned-media, no facturación. El link “ver” abre el VOD en el minuto exacto de la mención.
      </p>
    </div>
  );
}
