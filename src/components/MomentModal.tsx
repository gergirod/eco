"use client";
import { useMemo } from "react";
import { Badge } from "@/components/ui";
import { usd, num, compact } from "@/lib/format";
import { PROMINENCE_TONE, prominenceLabel } from "@/lib/prominence";
import { VALUATION_HINT, VALUATION_INFO, usdEst } from "@/lib/valuation";
import InfoTip from "@/components/InfoTip";
import { openProgramReport } from "@/lib/programReport";
import { chatEcoLine, chatHeadline, getChatReaction } from "@/lib/chatReaction";

const TIER_TONE = PROMINENCE_TONE;
const SENT_TONE: Record<string, "green" | "gray" | "red"> = {
  positivo: "green",
  neutro: "gray",
  negativo: "red",
};

// minuto-desde-el-inicio -> "h:mm" (ej. 110 -> "1:50"); <60 -> "0:MM"
function fmtClock(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
// segundos -> "h:mm:ss"
function fmtHMS(sec: number) {
  const s = Math.max(0, sec | 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function kfmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "K";
  return String(Math.round(n));
}

/* Gráfico de audiencia al minuto + barras de chat, con la marca del momento de la mención */
function MomentChart({ series, hotMin }: { series: any[]; hotMin: number }) {
  const W = 760,
    H = 250,
    padL = 46,
    padR = 14,
    padB = 30,
    padT = 16;
  const pts = series.filter((s) => s.c != null);
  if (!pts.length) return <div className="text-[12px] text-gray-400">Sin serie de audiencia.</div>;
  const maxC = Math.max(...pts.map((s) => s.c), 1);
  const maxChat = Math.max(...series.map((s) => s.chat || 0), 1);
  const lastMin = series[series.length - 1].m || pts[pts.length - 1].m || 1;
  const x = (m: number) => padL + (m / Math.max(1, lastMin)) * (W - padL - padR);
  const y = (c: number) => padT + (1 - c / maxC) * (H - padT - padB);
  const winLo = Math.max(0, hotMin - 2);
  const winHi = Math.min(lastMin, hotMin + 3);

  const line = pts.map((s) => `${x(s.m).toFixed(1)},${y(s.c).toFixed(1)}`).join(" ");
  const area = `${x(pts[0].m).toFixed(1)},${H - padB} ${line} ${x(pts[pts.length - 1].m).toFixed(1)},${H - padB}`;
  const hot = series.find((s) => s.m === hotMin) || pts.reduce((a, b) => (Math.abs(b.m - hotMin) < Math.abs(a.m - hotMin) ? b : a));
  const peak = pts.reduce((a, b) => (b.c > a.c ? b : a));

  // ticks de tiempo cada 30 min
  const xticks: number[] = [];
  for (let m = 0; m <= lastMin; m += 30) xticks.push(m);
  if (xticks[xticks.length - 1] !== lastMin) xticks.push(lastMin);
  // gridlines de audiencia
  const yvals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxC * f));
  const hotRight = x(hot.m) > W - 90;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 250 }}>
      <defs>
        <linearGradient id="audFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f5fe0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2f5fe0" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* ventana PNT: −2 / +3 min */}
      {winHi > winLo && (
        <rect
          x={x(winLo)}
          y={padT}
          width={Math.max(1, x(winHi) - x(winLo))}
          height={H - padT - padB}
          fill="#e2574c"
          opacity={0.06}
        />
      )}

      {/* gridlines + labels de audiencia (eje Y) */}
      {yvals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#eef0f4" strokeWidth={1} />
          <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="#9aa3af">
            {kfmt(v)}
          </text>
        </g>
      ))}

      {/* chat bars (fondo) */}
      {series.map((s, i) =>
        s.chat ? (
          <rect
            key={i}
            x={x(s.m) - 1.1}
            y={H - padB - ((s.chat / maxChat) * (H - padT - padB)) * 0.4}
            width={2.2}
            height={((s.chat / maxChat) * (H - padT - padB)) * 0.4}
            fill="#cdd8f2"
          />
        ) : null
      )}

      {/* área + línea de audiencia */}
      <polygon points={area} fill="url(#audFill)" />
      <polyline points={line} fill="none" stroke="#2f5fe0" strokeWidth={2} />

      {/* eje X: tiempo desde el inicio */}
      {xticks.map((m, i) => (
        <text key={i} x={x(m)} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#9aa3af">
          {fmtClock(m)}
        </text>
      ))}
      <text x={(padL + W - padR) / 2} y={H - 0.5} textAnchor="middle" fontSize="8.5" fill="#c0c6d0">
        tiempo desde el inicio del programa (h:mm)
      </text>

      {/* pico del programa */}
      <circle cx={x(peak.m)} cy={y(peak.c)} r={3} fill="#2f5fe0" />
      <text x={x(peak.m)} y={y(peak.c) - 7} textAnchor="middle" fontSize="9.5" fill="#2f5fe0" fontWeight="600">
        pico {kfmt(peak.c)}
      </text>

      {/* marca del momento de la mención */}
      {hot && hot.c != null && (
        <g>
          <line x1={x(hot.m)} y1={padT} x2={x(hot.m)} y2={H - padB} stroke="#e2574c" strokeWidth={1.3} strokeDasharray="4 3" />
          <circle cx={x(hot.m)} cy={y(hot.c)} r={4.5} fill="#e2574c" />
          <g transform={`translate(${x(hot.m) + (hotRight ? -8 : 8)},${padT + 4})`}>
            <text textAnchor={hotRight ? "end" : "start"} fontSize="10.5" fill="#e2574c" fontWeight="700">
              mención · {fmtClock(hot.m)}
            </text>
            <text y={13} textAnchor={hotRight ? "end" : "start"} fontSize="9.5" fill="#e2574c">
              {kfmt(hot.c)} de atención
            </text>
          </g>
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
  const chatRx = useMemo(() => getChatReaction(mention), [mention]);
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
          {mention.quote
            ? `“${mention.quote}”`
            : "La marca se nombró en este tramo; la transcripción no fijó la frase textual exacta."}
        </blockquote>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge tone={TIER_TONE[mention.tier] || "gray"}>
            {prominenceLabel(mention.tier, mention.tier_label)}
          </Badge>
          <Badge tone={SENT_TONE[mention.sentiment] || "gray"}>sentimiento {mention.sentiment}</Badge>
          <Badge tone="gray">{fmtHMS(mention.t_seconds || 0)} del programa</Badge>
          {mention.precise ? <Badge tone="green">timestamp exacto</Badge> : <Badge tone="amber">minuto aprox.</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Audiencia en el minuto</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums">
              {concAt != null ? num(concAt) : "s/d"}
            </div>
            <div className="text-[11px] text-gray-400">concurrentes</div>
          </div>
          <div className="card px-4 py-3">
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-400">
              Exposición estimada
              <InfoTip text={VALUATION_INFO} label="Qué significa la exposición en USD" />
            </div>
            <div className="text-[18px] font-semibold mt-1 tabular-nums leading-snug">{usdEst(mention.value_usd)}</div>
            <div className="text-[11px] text-gray-400 leading-snug mt-1">{VALUATION_HINT}</div>
          </div>
        </div>

        <div className="card px-4 py-3.5 mb-5">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">Chat en la pauta</div>
          <p
            className={`text-[14px] leading-relaxed ${
              chatRx.tone === "up"
                ? "text-green-800"
                : chatRx.tone === "down"
                  ? "text-amber-900"
                  : "text-gray-700"
            }`}
          >
            {chatRx.headline || chatRx.table_line || "—"}
          </p>
          {chatRx.pre_rpm != null && chatRx.post_rpm != null && chatRx.cobertura && (
            <p className="text-[12px] text-gray-500 mt-2 tabular-nums">
              Ritmo del chat: <b>{chatRx.pre_rpm}</b> msgs/min en los 2 min anteriores →{" "}
              <b>{chatRx.post_rpm}</b> en los 3 min posteriores
            </p>
          )}
          {(chatRx.detail_lines || []).map((line, i) => (
            <p key={i} className="text-[12.5px] text-gray-600 mt-2">
              {line}
            </p>
          ))}
          {chatEcoLine(mention) && (chatRx.eco_marca_post ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1">
                Eco de comunidad
              </div>
              <p className="text-[13.5px] text-gray-700 leading-relaxed">{chatEcoLine(mention)}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                La audiencia repitió la marca en el chat — no certifica que corrió la pauta.
              </p>
            </div>
          )}
          {chatRx.ejemplos && chatRx.ejemplos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">
                Ejemplos de la audiencia
              </div>
              <ul className="text-[13px] text-gray-600 space-y-1">
                {chatRx.ejemplos.map((e, i) => (
                  <li key={i} className="italic">“{e}”</li>
                ))}
              </ul>
              <p className="text-[11px] text-gray-400 mt-2">
                El chat no certifica pauta — mide reacción de la sala.
              </p>
            </div>
          )}
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
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: "#fde8e6" }} />ventana de la aparición (−2 / +3 min)</span>
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
