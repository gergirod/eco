"use client";
import { useMemo } from "react";
import { Badge } from "@/components/ui";
import { usd, num, compact } from "@/lib/format";
import { openProgramReport } from "@/lib/programReport";

const TIER_TONE: Record<number, "blue" | "green" | "gray"> = { 1: "blue", 2: "green", 3: "gray" };
const SENT_TONE: Record<string, "green" | "gray" | "red"> = {
  positivo: "green",
  neutro: "gray",
  negativo: "red",
};

function fmtMin(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* Gráfico de audiencia al minuto + barras de chat, con la marca del momento de la mención */
function MomentChart({ series, hotMin }: { series: any[]; hotMin: number }) {
  const W = 760,
    H = 220,
    padL = 6,
    padB = 22,
    padT = 8;
  const pts = series.filter((s) => s.c != null);
  if (!pts.length) return <div className="text-[12px] text-gray-400">Sin serie de audiencia.</div>;
  const maxC = Math.max(...pts.map((s) => s.c), 1);
  const maxChat = Math.max(...series.map((s) => s.chat || 0), 1);
  const n = series.length;
  const x = (m: number) => padL + (m / Math.max(1, n - 1)) * (W - padL * 2);
  const y = (c: number) => padT + (1 - c / maxC) * (H - padT - padB);

  const line = pts.map((s) => `${x(s.m).toFixed(1)},${y(s.c).toFixed(1)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${x(pts[pts.length - 1].m).toFixed(1)},${H - padB}`;
  const hot = series.find((s) => s.m === hotMin) || pts.reduce((a, b) => (Math.abs(b.m - hotMin) < Math.abs(a.m - hotMin) ? b : a));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      {/* chat bars (fondo) */}
      {series.map((s, i) =>
        s.chat ? (
          <rect
            key={i}
            x={x(s.m) - 1.2}
            y={H - padB - ((s.chat / maxChat) * (H - padT - padB)) * 0.5}
            width={2.4}
            height={((s.chat / maxChat) * (H - padT - padB)) * 0.5}
            fill="#d9e1f5"
          />
        ) : null
      )}
      {/* área de audiencia */}
      <polygon points={area} fill="#eef2fd" />
      <polyline points={line} fill="none" stroke="#2f5fe0" strokeWidth={1.8} />
      {/* marca del momento */}
      {hot && hot.c != null && (
        <g>
          <line x1={x(hot.m)} y1={padT} x2={x(hot.m)} y2={H - padB} stroke="#e2574c" strokeWidth={1.2} strokeDasharray="3 3" />
          <circle cx={x(hot.m)} cy={y(hot.c)} r={4} fill="#e2574c" />
          <text x={x(hot.m)} y={padT + 10} textAnchor="middle" fontSize="9" fill="#e2574c" fontWeight="600">
            mención {fmtMin(hot.m)}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function MomentModal({
  mention,
  moment,
  brandName,
  onClose,
}: {
  mention: any;
  moment: any | null;
  brandName?: string;
  onClose: () => void;
}) {
  const hotMin = Math.floor((mention.t_seconds || 0) / 60);
  const chatAt = useMemo(() => {
    if (!moment) return null;
    const s = moment.series.find((x: any) => x.m === hotMin);
    return s ? s.chat : null;
  }, [moment, hotMin]);
  const concAt = useMemo(() => {
    if (!moment) return mention.views;
    const near = moment.series
      .filter((x: any) => x.c != null)
      .reduce((a: any, b: any) => (Math.abs(b.m - hotMin) < Math.abs(a.m - hotMin) ? b : a), moment.series.find((x:any)=>x.c!=null));
    return near?.c ?? null;
  }, [moment, hotMin, mention.views]);

  const vodLink = `https://www.youtube.com/watch?v=${mention.video_id}&t=${mention.t_seconds | 0}s`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-[820px] max-h-[88vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-accent font-medium">
              Momento de Atención
            </div>
            <h2 className="text-[18px] font-semibold mt-0.5">
              {mention.channel_name} · {mention.date}
            </h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5 max-w-[620px]">{mention.title}</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <blockquote className="border-l-2 border-accent pl-3 my-4 text-[14px] italic text-gray-700">
          {mention.quote ? `“${mention.quote}”` : "Mención detectada (sin cita textual precisa)."}
        </blockquote>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge tone={TIER_TONE[mention.tier] || "gray"}>{mention.tier_label}</Badge>
          <Badge tone={SENT_TONE[mention.sentiment] || "gray"}>sentimiento {mention.sentiment}</Badge>
          <Badge tone="gray">minuto {mention.minute}</Badge>
          {mention.precise ? <Badge tone="green">timestamp exacto</Badge> : <Badge tone="amber">minuto aprox.</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Audiencia en el minuto</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums">
              {concAt != null ? num(concAt) : "s/d"}
            </div>
            <div className="text-[11px] text-gray-400">concurrentes</div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Reacción del chat</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums">
              {chatAt != null ? num(chatAt) : "s/d"}
            </div>
            <div className="text-[11px] text-gray-400">
              {moment?.has_chat ? "mensajes en ese minuto" : "chat no capturado"}
            </div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Valor de referencia</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums">{usd(mention.value_usd)}</div>
            <div className="text-[11px] text-gray-400">lente CPM</div>
          </div>
        </div>

        {moment ? (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-semibold">Audiencia al minuto</h3>
              <span className="text-[11px] text-gray-400">
                pico {compact(moment.peak)} · promedio {compact(moment.avg)} · {moment.dur_min} min
              </span>
            </div>
            <MomentChart series={moment.series} hotMin={hotMin} />
            <div className="flex gap-4 text-[11px] text-gray-400 mt-1">
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: "#2f5fe0" }} />audiencia concurrente</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: "#d9e1f5" }} />volumen de chat</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: "#e2574c" }} />momento de la mención</span>
            </div>
          </div>
        ) : (
          <div className="text-[12.5px] text-gray-400 mb-4">
            Sin serie de audiencia capturada para este programa (mención de archivo/VOD).
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <a href={vodLink} target="_blank" rel="noreferrer" className="btn btn-primary">
            ▶ Ver el momento en el VOD
          </a>
          <button
            className="btn btn-ghost"
            onClick={() =>
              openProgramReport({
                ...mention,
                brand_name: brandName || mention.brand_name,
                conc_at: concAt,
                program_peak: moment?.peak,
              })
            }
          >
            ⬇ Descargar reporte del programa (PDF)
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          No estimamos impresiones ni tasamos por tarifa teórica (AVE): medimos la atención real al
          minuto de la mención y la respuesta de la audiencia en el chat. Valorización = lente CPM
          (MODELO-VALORIZACION), benchmark de exposición, no facturación.
        </p>
      </div>
    </div>
  );
}
