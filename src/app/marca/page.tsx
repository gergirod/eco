"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import { usd, num, compact, fmtHMS } from "@/lib/format";
import { PROMINENCE_BAR } from "@/lib/prominence";
import { VALUATION_HINT, VALUATION_INFO, usdEst } from "@/lib/valuation";
import ValuationNotice from "@/components/ValuationNotice";
import { useDataset } from "@/lib/useDataset";
import reportsFb from "@/data/reports.json";
import channelsFb from "@/data/channels.json";
import momentsFb from "@/data/moments.json";
import metaFb from "@/data/meta.json";
import { buildReportHTML } from "@/lib/report";
import { calcEfficiency, loadInversion, saveInversion } from "@/lib/efficiency";
import MomentModal from "@/components/MomentModal";
import ActivationsTable from "@/components/ActivationsTable";

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
              <title>{`${s.date} · ${s.mentions} menciones · ${usdEst(s.value_usd)}`}</title>
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
  const moments = useDataset<any>("moments", momentsFb);
  const [openMention, setOpenMention] = useState<any | null>(null);
  const CH_NAME: Record<string, string> = useMemo(
    () => Object.fromEntries(channels.map((c: any) => [c.id, c.name])),
    [channels]
  );
  const options = useMemo(
    () =>
      Object.entries(reports as any)
        .map(([slug, r]: any) => ({
          slug, name: r.name, mentions: r.mentions, kind: r.kind || "marca",
        }))
        .filter((o) => o.kind === "marca")
        .sort((a, b) => b.mentions - a.mentions),
    [reports]
  );
  const totalPnt = useMemo(
    () => options.reduce((a, o) => a + o.mentions, 0),
    [options]
  );
  const [brand, setBrand] = useState(options[0]?.slug || "");
  const [inversion, setInversion] = useState<number | "">("");
  // permite llegar desde el Media Kit con ?brand=<slug>
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("brand");
    if (q && (reports as any)[q]) setBrand(q);
  }, [reports]);
  useEffect(() => {
    const saved = loadInversion(brand);
    setInversion(saved ?? "");
  }, [brand]);
  const r: any = (reports as any)[brand] || (reports as any)[options[0]?.slug];

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
    const inv = typeof inversion === "number" && inversion > 0 ? inversion : null;
    const html = buildReportHTML(r, { reach, programs, topChannel, chName: CH_NAME, inversionUsd: inv });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  }

  const efficiency = useMemo(() => {
    const inv = typeof inversion === "number" && inversion > 0 ? inversion : null;
    if (!inv) return null;
    return calcEfficiency(inv, r.value_usd || 0, r.mentions || 0);
  }, [inversion, r]);

  return (
    <div>
      <PageHeader
        title="Reportes de marca"
        sub="Entregable comercial: PNT verificada, minuto exacto, concurrentes en vivo y PDF listo para mandar."
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <BrandPicker options={options} value={brand} onChange={setBrand} />
        {r?.kind && r.kind !== "marca" && (
          <Badge tone="amber">{r.kind === "plataforma" ? "plataforma" : "lugar"} · no anunciante</Badge>
        )}
        <span className="text-[12px] text-gray-400">
          {options.length} anunciantes · {num((metaFb as any).n_pauta_mentions ?? totalPnt)} PNT
        </span>
        <button className="btn btn-primary ml-auto" onClick={downloadPDF}>
          ↓ Descargar one-pager PDF
        </button>
      </div>

      {/* resumen ejecutivo */}
      <div className="card p-5 mb-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
        <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1.5">
          Resumen ejecutivo
        </div>
        <p className="text-[15px] leading-relaxed text-gray-700 max-w-[820px]">
          <b>{r.name}</b> acumula <b>{num(r.mentions)}</b> lecturas de pauta (PNT) en{" "}
          <b>{programs}</b> programas across <b>{r.channels.length}</b> streams, con exposición total de{" "}
          <b>{usdEst(r.value_usd)}</b> de exposición estimada en rango (benchmark, no facturación).{" "}
          {best && (
            <>
              El momento más fuerte: <b>{best.channel_name}</b> el {best.date}
              {best.conc_at ? (
                <>
                  {" "}
                  — <b>{compact(best.conc_at)}</b> mirando en vivo en el minuto exacto (
                  {usdEst(best.value_usd)})
                </>
              ) : (
                <> ({usdEst(best.value_usd)})</>
              )}
              . Mayor presencia en <b>{topChannel}</b>.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="PNT verificadas" value={num(r.mentions)} hint={`en ${programs} programas`} />
        <Stat label="Canales" value={r.channels.length} hint="streams con pauta" />
        <Stat
          label="Pico en vivo"
          value={best?.conc_at ? compact(best.conc_at) : "—"}
          hint={best ? `marca ${fmtHMS(best.t_seconds || 0)}` : "sin concurrentes"}
        />
        <Stat
          label="Exposición estimada"
          value={usdEst(r.value_usd)}
          hint={VALUATION_HINT}
          info={VALUATION_INFO}
        />
      </div>

      <div className="mb-5">
        <ValuationNotice />
      </div>

      {/* Capa 1.5 — inversión declarada (opcional, solo producto marca) */}
      <div className="card p-5 mb-5">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h2 className="text-[15px] font-semibold">¿Valió la pena? · Inversión declarada</h2>
          <span className="text-[11px] text-gray-400">Opcional · solo en PDF marca</span>
        </div>
        <p className="text-[13px] text-gray-500 mb-3 max-w-[720px]">
          Si el cliente comparte cuánto pagó por la pauta, comparamos contra la exposición medida (benchmark).
          No inferimos precios — el número lo carga el usuario.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[13px] text-gray-600">
            Inversión total declarada (USD)
            <input
              type="number"
              min={0}
              step={100}
              placeholder="ej. 15000"
              value={inversion}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Number(e.target.value);
                setInversion(v);
                if (typeof v === "number" && v > 0) saveInversion(brand, v);
                else saveInversion(brand, null);
              }}
              className="block mt-1 w-44 px-3 py-2 border border-[#ececec] rounded-lg text-[14px]"
            />
          </label>
          {efficiency && (
            <div
              className={`flex-1 min-w-[240px] rounded-lg px-4 py-3 text-[13px] leading-relaxed ${
                efficiency.verdict === "strong"
                  ? "bg-green-50 text-green-900 border border-green-100"
                  : efficiency.verdict === "weak"
                    ? "bg-amber-50 text-amber-900 border border-amber-100"
                    : "bg-blue-50 text-blue-900 border border-blue-100"
              }`}
            >
              <b>{efficiency.headline}</b>
              <div className="text-[12px] mt-1 opacity-90">
                {efficiency.bullets[1]} · {efficiency.bullets[2]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* evolución + desgloses */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mb-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Evolución temporal</h2>
          <EvolutionChart series={r.series} />
          <div className="text-[11px] text-gray-400 mt-1">Exposición estimada por día (benchmark, no factura).</div>
        </div>
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-[13px] font-semibold mb-2.5">Formato de la pauta</h3>
            <SegBar
              parts={PROMINENCE_BAR.map((p) => ({
                label: p.label,
                value: tier[p.key as "1" | "2" | "3"] || 0,
                color: p.color,
              }))}
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
                <div className="text-[11px] text-gray-400 mt-0.5">{usdEst(v.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <ActivationsTable
          variant="brand"
          rows={r.detail}
          chName={CH_NAME}
          onRowClick={setOpenMention}
          title={`Menciones · ${r.name}`}
          subtitle="click en una fila → Momento de Atención"
        />
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Solo lecturas de pauta verificadas (menciones_patrocinadas + cita en transcript).
        El link “ver” abre el VOD en el segundo exacto.
      </p>

      {openMention && (
        <MomentModal
          mention={openMention}
          moment={(moments as any)[openMention.video_id] || null}
          brandName={r.name}
          onClose={() => setOpenMention(null)}
        />
      )}
    </div>
  );
}
