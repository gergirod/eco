"use client";

import Link from "next/link";
import {
  commercialTipoBreakdown,
  commercialTipoLabel,
  type CommercialDemandExport,
  type CommercialChannelRow,
  type CommercialProgramRow,
  type CommercialSignal,
  type PntCorrelation,
} from "@/lib/commercialDemand";
import { detectShowFormat } from "@/lib/showFormat";

function ChannelRankRow({ ch, rank }: { ch: CommercialChannelRow; rank: number }) {
  const breakdown = commercialTipoBreakdown(ch.by_tipo);
  return (
    <Link
      href={`/canales/${ch.id}?tab=audiencia`}
      className="card p-5 block hover:border-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 mb-1">#{rank} en demanda comercial</p>
          <h3 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
            {ch.name}
          </h3>
          <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
            <b className="text-ink">{ch.commercial_messages}</b> pedidos de link, precio o compra
            {ch.commercial_per_1k != null ? (
              <>
                {" "}
                · <b className="text-ink">{ch.commercial_per_1k}</b> por cada mil mirando
              </>
            ) : null}
            {ch.commercial_pct != null ? (
              <> · {ch.commercial_pct}% del chat de esas emisiones</>
            ) : null}
            {(ch.post_pnt_messages ?? 0) > 0 ? (
              <> · {ch.post_pnt_messages} post-PNT (5 min)</>
            ) : null}
          </p>
          {breakdown && (
            <p className="text-[12px] text-gray-500 mt-2">{breakdown}</p>
          )}
          {ch.top_examples?.[0] && (
            <p className="text-[12px] text-gray-400 mt-2 truncate italic">
              Ej: «{ch.top_examples[0].text.slice(0, 72)}
              {ch.top_examples[0].text.length > 72 ? "…" : ""}»
            </p>
          )}
        </div>
        <span className="text-[12.5px] text-accent font-medium shrink-0 group-hover:underline">
          Ver →
        </span>
      </div>
    </Link>
  );
}

function ProgramRankRow({ p, rank }: { p: CommercialProgramRow; rank: number }) {
  const show = detectShowFormat(p.channel_id, p.title);
  return (
    <Link
      href={`/programas/${p.video_id}`}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[12px] text-gray-400">
        #{rank} · {p.channel}
        {show ? ` · ${show.name}` : ""}
      </p>
      <p className="text-[13.5px] text-gray-800 font-medium leading-snug line-clamp-2 mt-0.5">
        {p.title}
      </p>
      <p className="text-[12px] text-gray-500 mt-1">
        {p.commercial_messages} pedidos comerciales
        {p.commercial_per_1k != null ? ` · ${p.commercial_per_1k} por mil mirando` : ""}
        {commercialTipoBreakdown(p.by_tipo) ? ` · ${commercialTipoBreakdown(p.by_tipo)}` : ""}
      </p>
    </Link>
  );
}

function SignalRow({ s }: { s: CommercialSignal }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex flex-wrap items-baseline gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-accent">
          {commercialTipoLabel(s.tipo)}
        </span>
        {s.cross_canal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            en varios canales
          </span>
        )}
        <span className="text-[11px] text-gray-400 tabular-nums">×{s.count}</span>
      </div>
      <p className="text-[13px] text-gray-700 italic leading-relaxed">«{s.text}»</p>
      <p className="text-[11px] text-gray-400 mt-1">
        {s.n_programas} {s.n_programas === 1 ? "emisión" : "emisiones"}
        {s.canales.length ? ` · ${s.canales.join(", ")}` : ""}
      </p>
    </div>
  );
}

function PntCorrelationRow({ row }: { row: PntCorrelation }) {
  const href = row.video_id ? `/programas/${row.video_id}` : "/donde-pautar";
  return (
    <Link
      href={href}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[12px] text-gray-400">
        {row.channel} · chat min {row.minute} · PNT {row.brand} @ {row.pnt_minute}
        {row.delta_sec >= 0 ? ` (+${row.delta_sec}s)` : ` (${row.delta_sec}s)`}
      </p>
      <p className="text-[13px] text-gray-700 italic leading-relaxed mt-0.5">«{row.text}»</p>
      <p className="text-[11px] text-gray-400 mt-1">
        {commercialTipoLabel(row.tipo)}
        {row.brand_in_chat ? " · menciona la marca en chat" : " · pedido genérico post-lectura"}
      </p>
    </Link>
  );
}

type Props = {
  report: CommercialDemandExport;
  rubroLabel?: string | null;
  /** platform = informe cross-canal; channel = drill-down en perfil de canal */
  mode?: "platform" | "channel";
};

export default function CommercialDemandSection({ report, rubroLabel, mode = "platform" }: Props) {
  const channels = report.channels.filter((c) => c.commercial_messages > 0);
  const programs = report.programs.filter((p) => p.commercial_messages > 0);
  const signals = report.top_signals.filter((s) =>
    ["pedido_link", "pregunta_precio", "pregunta_compra"].includes(s.tipo)
  );
  const pntRows = report.pnt_correlations ?? [];
  const filterNote =
    report.filter?.llm_used
      ? `Filtrado: ${report.filter.confirmed_total ?? "—"} confirmados`
      : "Filtrado heurístico (sin LLM en export)";

  if (!channels.length && !programs.length) {
    return (
      <section className={mode === "channel" ? "mt-6" : "mt-8"}>
        <h2 className="text-[15px] font-semibold text-ink mb-2">Demanda comercial en chat</h2>
        <div className="card p-5 text-[14px] text-gray-600 leading-relaxed">
          No detectamos pedidos claros de link, precio o compra en el chat del período — o no hay
          chat capturado (LUZU sin datos).
        </div>
      </section>
    );
  }

  const channelRow = mode === "channel" ? channels[0] : null;

  return (
    <section className={mode === "channel" ? "mt-6" : "mt-8"}>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-ink">Demanda comercial en chat</h2>
        <p className="text-[13px] text-gray-500 mt-1 max-w-2xl leading-relaxed">
          {mode === "channel" && channelRow ? (
            <>
              En este canal detectamos <b className="text-gray-700">{channelRow.commercial_messages}</b>{" "}
              pedidos de link, precio o compra en {channelRow.programs_with_chat}{" "}
              {channelRow.programs_with_chat === 1 ? "emisión" : "emisiones"} con chat.
            </>
          ) : (
            <>
              Dónde la audiencia pidió link, precio o dónde comprar — señal para activaciones con promo
              clara o un agente de chat.
              {rubroLabel ? ` Filtrado por rubro: ${rubroLabel}.` : ""}
            </>
          )}
        </p>
        {mode === "platform" && report.summary_line && (
          <p className="text-[13.5px] text-gray-700 mt-2 max-w-2xl leading-relaxed">
            {report.summary_line}
          </p>
        )}
        {report.disclaimer && (
          <p className="text-[12px] text-gray-400 mt-2 max-w-2xl">{report.disclaimer}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">{filterNote}</p>
      </div>

      {mode === "platform" && channels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-medium text-gray-700 mb-3">Canales con más demanda</h3>
          <div className="flex flex-col gap-3">
            {channels.slice(0, 5).map((ch, i) => (
              <ChannelRankRow key={ch.id} ch={ch} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-[15px] font-semibold mb-1">
            {mode === "channel" ? "Emisiones con más pedidos" : "Emisiones con más pedidos comerciales"}
          </h3>
          <p className="text-[12.5px] text-gray-500 mb-3">
            Programa = show (NDN, Olga, etc.) · emisión = vivo del día
          </p>
          {programs.slice(0, 8).map((p, i) => (
            <ProgramRankRow key={p.video_id} p={p} rank={i + 1} />
          ))}
        </div>
      )}

      {pntRows.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-[15px] font-semibold mb-1">
            {mode === "channel" ? "Pedidos post-PNT en este canal" : "Demanda después de PNT"}
          </h3>
          <p className="text-[12.5px] text-gray-500 mb-3">
            Chat comercial dentro de 5 minutos después de una lectura publicitaria verificada.
          </p>
          {pntRows.slice(0, mode === "channel" ? 5 : 8).map((row, i) => (
            <PntCorrelationRow key={`${row.video_id}-${i}`} row={row} />
          ))}
        </div>
      )}

      {signals.length > 0 && mode === "platform" && (
        <div className="card p-5">
          <h3 className="text-[15px] font-semibold mb-3">Qué pidieron (ejemplos)</h3>
          {signals.slice(0, 6).map((s, i) => (
            <SignalRow key={i} s={s} />
          ))}
        </div>
      )}
    </section>
  );
}
