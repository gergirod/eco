"use client";
import { useState, useMemo } from "react";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import { usd, num, compact } from "@/lib/format";
import { useDataset } from "@/lib/useDataset";
import reportsFb from "@/data/reports.json";
import channelsFb from "@/data/channels.json";
import { buildReportHTML } from "@/lib/report";

function tsLink(videoId: string, seconds: number) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, seconds | 0)}s`;
}

const TIER_TONE: Record<number, "blue" | "green" | "gray"> = { 1: "blue", 2: "green", 3: "gray" };
const SENT_TONE: Record<string, "green" | "gray" | "red"> = {
  positivo: "green",
  neutro: "gray",
  negativo: "red",
};

/* --- mini gráfico de evolución (SVG, sin dependencias) --- */
function EvolutionChart({ series }: { series: any[] }) {
  if (!series || series.length === 0)
    return <div className="text-[12px] text-gray-400">Sin serie temporal.</div>;
  const W = 720,
    H = 150,
    pad = 8;
  const maxV = Math.max(...series.map((s) => s.value_usd), 1);
  const n = series.length;
  const bw = (W - pad * 2) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      {series.map((s, i) => {
        const h = ((H - 28) * s.value_usd) / maxV;
        const x = pad + i * bw;
        const y = H - 20 - h;
        return (
          <g key={i}>
            <rect
              x={x + bw * 0.18}
              y={y}
              width={bw * 0.64}
              height={Math.max(1, h)}
              rx={2}
              fill="#2f5fe0"
              opacity={0.85}
            >
              <title>{`${s.date} · ${s.mentions} menciones · ${usd(s.value_usd)}`}</title>
            </rect>
            {n <= 16 && (
              <text
                x={x + bw / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="8"
                fill="#aaa"
              >
                {s.date.slice(0, 5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* --- barra segmentada para tier / sentimiento --- */
function SegBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
        {parts.map((p, i) => (
          <div
            key={i}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.label} <span className="tabular-nums text-gray-400">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const tier = r.by_tier || { "1": 0, "2": 0, "3": 0 };
  const sent = r.by_sentiment || { positivo: 0, neutro: 0, negativo: 0 };
  const best = r.best;
  const topChannel = byChannel[0] ? CH_NAME[byChannel[0][0]] || byChannel[0][0] : "—";

  function downloadPDF() {
    const html = buildReportHTML(r, { reach, programs, topChannel, chName: CH_NAME });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  }

  return (
    <div>
      <PageHeader
        title="Dashboard de marca"
        sub="Vista del cliente · modo agencia. Elegí la marca que pautás y mirá dónde apareció."
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <BrandPicker options={options} value={brand} onChange={setBrand} />
        <span className="text-[12px] text-gray-400">
          {options.length} marcas con menciones · modo agencia (varias marcas)
        </span>
        <button className="btn btn-primary ml-auto" onClick={downloadPDF}>
          ↓ Descargar reporte PDF
        </button>
      </div>

      {/* resumen ejecutivo */}
      <div className="card p-5 mb-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
        <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1.5">
          Resumen ejecutivo
        </div>
        <p className="text-[15px] leading-relaxed text-gray-700 max-w-[820px]">
          <b>{r.name}</b> registró <b>{num(r.mentions)}</b> menciones en{" "}
          <b>{programs}</b> programas across <b>{r.channels.length}</b> streams, con una exposición de{" "}
          <b>{compact(reach)}</b> views acumuladas y un valor de referencia de{" "}
          <b>{usd(r.value_usd)}</b> (lente CPM).{" "}
          {best && (
            <>
              El pico fue en <b>{best.channel_name}</b> el {best.date} (
              {usd(best.value_usd)}). La mayor presencia estuvo en <b>{topChannel}</b>.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Menciones" value={num(r.mentions)} hint={`en ${programs} programas`} />
        <Stat label="Canales" value={r.channels.length} hint="streams con aparición" />
        <Stat label="Alcance VOD" value={compact(reach)} hint="views acumuladas" />
        <Stat label="Valor de referencia" value={usd(r.value_usd)} hint="lente CPM, benchmark" />
      </div>

      {/* evolución + desgloses */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mb-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Evolución temporal</h2>
          <EvolutionChart series={r.series} />
          <div className="text-[11px] text-gray-400 mt-1">Valor de referencia por día (USD).</div>
        </div>
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-[13px] font-semibold mb-2.5">Prominencia (tier)</h3>
            <SegBar
              parts={[
                { label: "Pauta / PNT", value: tier["1"] || 0, color: "#2f5fe0" },
                { label: "Orgánica", value: tier["2"] || 0, color: "#22a06b" },
                { label: "Aproximada", value: tier["3"] || 0, color: "#cbd2dd" },
              ]}
            />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold mb-2.5">Sentimiento</h3>
            <SegBar
              parts={[
                { label: "Positivo", value: sent.positivo || 0, color: "#22a06b" },
                { label: "Neutro", value: sent.neutro || 0, color: "#cbd2dd" },
                { label: "Negativo", value: sent.negativo || 0, color: "#e2574c" },
              ]}
            />
          </div>
        </div>
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
          <div className="max-h-[620px] overflow-auto">
            <table>
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th>Fecha</th>
                  <th>Canal</th>
                  <th>Prueba textual</th>
                  <th>Tier</th>
                  <th>Sent.</th>
                  <th className="text-right">Views</th>
                  <th className="text-right">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {r.detail.map((d: any, i: number) => (
                  <tr key={i}>
                    <td className="text-gray-500 whitespace-nowrap">{d.date}</td>
                    <td className="whitespace-nowrap">{CH_NAME[d.channel] || d.channel_name}</td>
                    <td className="max-w-[340px]">
                      {d.quote ? (
                        <span className="text-gray-700 italic">“{d.quote}”</span>
                      ) : (
                        <span className="text-gray-400 truncate block" title={d.title}>
                          {d.title}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {d.title?.slice(0, 48)}
                        {d.title?.length > 48 ? "…" : ""} · {d.minute}
                      </span>
                    </td>
                    <td>
                      <Badge tone={TIER_TONE[d.tier] || "gray"}>{d.tier_label}</Badge>
                    </td>
                    <td>
                      <Badge tone={SENT_TONE[d.sentiment] || "gray"}>
                        {d.sentiment === "positivo" ? "＋" : d.sentiment === "negativo" ? "－" : "○"}
                      </Badge>
                    </td>
                    <td className="text-right tabular-nums">{compact(d.views)}</td>
                    <td className="text-right tabular-nums text-gray-500">{usd(d.value_usd)}</td>
                    <td>
                      <a
                        href={tsLink(d.video_id, d.t_seconds)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent text-[12px] hover:underline whitespace-nowrap"
                      >
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

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Valor de referencia = lente CPM (audiencia × CPM × peso de prominencia), según
        MODELO-VALORIZACION. Es un benchmark de exposición earned-media, no facturación. El tier
        (pauta / orgánica / aproximada) y el sentimiento se infieren del contexto hablado alrededor de
        la mención. El link “ver” abre el VOD en el segundo exacto.
      </p>
    </div>
  );
}
