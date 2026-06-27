"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ConversacionHighlight, ConversacionTopic } from "@/lib/conversacion";
import {
  channelSlug,
  groupHighlightsByChannel,
  highlightProgramHref,
  highlightTS,
} from "@/lib/conversacion";
import { fmtHMS, vodLink } from "@/lib/format";

import {
  CHAT_DISCLAIMER,
  EVIDENCE_LANE_HINT,
  EVIDENCE_LANE_LABEL,
  isEvidenceLane,
} from "@/lib/evidenceLane";
import {
  GT_STATUS_HINT,
  GT_STATUS_LABEL,
  isGtStatus,
} from "@/lib/googleTrends";

const MOMENTUM_STYLE: Record<
  ConversacionTopic["momentum"],
  { className: string }
> = {
  sube: { className: "text-green-700 bg-green-50 border-green-100" },
  baja: { className: "text-amber-800 bg-amber-50 border-amber-100" },
  estable: { className: "text-gray-600 bg-gray-50 border-gray-200" },
  nuevo: { className: "text-accent bg-accent-soft/50 border-accent/20" },
};

const CHANNEL_STYLE: Record<string, string> = {
  OLGA: "bg-sky-50 text-sky-800 border-sky-200",
  "LUZU TV": "bg-violet-50 text-violet-800 border-violet-200",
  BLENDER: "bg-orange-50 text-orange-800 border-orange-200",
  BONDI: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Bondi Live": "bg-emerald-50 text-emerald-800 border-emerald-200",
  GELATINA: "bg-pink-50 text-pink-800 border-pink-200",
  "Neura Media": "bg-indigo-50 text-indigo-800 border-indigo-200",
  Vorterix: "bg-red-50 text-red-800 border-red-200",
  BorderPeriodismo: "bg-teal-50 text-teal-800 border-teal-200",
  "Border Periodismo": "bg-teal-50 text-teal-800 border-teal-200",
  "El Cronista": "bg-amber-50 text-amber-900 border-amber-200",
  "AHORA PLAY": "bg-blue-50 text-blue-900 border-blue-200",
  "Ahora Play": "bg-blue-50 text-blue-900 border-blue-200",
  "A U R A": "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200",
  Aura: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200",
  Cenital: "bg-purple-50 text-purple-900 border-purple-200",
};

const INITIAL_SHOWN = 6;

type Props = { topic: ConversacionTopic; showGoogleTrends?: boolean };

function titleLabel(tema: string): string {
  return tema
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mencionesLabel(topic: ConversacionTopic): string {
  const n = topic.menciones;
  const angulos = topic.highlightsTotal;
  if (angulos > 0 && angulos < n) {
    return `${n} apariciones en audio · ${angulos} ángulos distintos`;
  }
  return `${n} apariciones en audio`;
}

function channelBadgeClass(channel: string): string {
  return CHANNEL_STYLE[channel] || "bg-gray-100 text-gray-700 border-gray-200";
}

function HighlightCard({
  h,
  topicTema,
  index,
}: {
  h: ConversacionHighlight;
  topicTema: string;
  index: number;
}) {
  const t = highlightTS(h);
  const minuteLabel = t > 0 ? fmtHMS(t) : null;

  return (
    <li className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${channelBadgeClass(h.channel)}`}
          >
            {h.channel}
          </span>
          {minuteLabel ? (
            <span className="text-[10px] text-gray-500 tabular-nums">min {minuteLabel}</span>
          ) : null}
        </div>
        <span className="text-[10px] text-gray-400 tabular-nums shrink-0">#{index + 1}</span>
      </div>
      <div className="px-3.5 py-3">
        {h.subtema && h.subtema.toLowerCase() !== topicTema.toLowerCase() ? (
          <div className="text-[11px] font-medium text-accent/90 mb-2">{titleLabel(h.subtema)}</div>
        ) : null}
        <p className="text-[13px] text-gray-700 leading-relaxed border-l-[3px] border-accent/40 pl-3 bg-gray-50/60 py-2 pr-2 rounded-r-md mb-3">
          {h.contexto}
        </p>
        <p className="text-[11px] text-gray-400 mb-2 line-clamp-1" title={h.title}>
          {h.title || h.video_id}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={vodLink(h.video_id, t)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] text-accent font-medium hover:underline"
          >
            Escuchar este tramo ↗
          </a>
          <Link
            href={highlightProgramHref(h)}
            className="text-[11.5px] text-gray-600 hover:text-accent font-medium hover:underline"
          >
            Ver emisión en ECO →
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function ConversacionRow({ topic, showGoogleTrends = false }: Props) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const mom = MOMENTUM_STYLE[topic.momentum];
  const spark = topic.serie.slice(-8);
  const sparkMax = Math.max(...spark.map((p) => p.n), 1);
  const hasDetail = topic.highlights.length > 0 || topic.variantesRelacionadas.length > 0;
  const grouped = useMemo(
    () => groupHighlightsByChannel(topic.highlights, topic.canales),
    [topic.highlights, topic.canales]
  );
  const multiChannel = grouped.length > 1;
  const visibleHighlights = showAll
    ? topic.highlights
    : topic.highlights.slice(0, INITIAL_SHOWN);
  const hiddenCount = topic.highlights.length - visibleHighlights.length;
  const exampleCount = Math.min(topic.highlights.length, topic.highlightsTotal);
  const lane = topic.evidenceLane;
  const laneStyle =
    lane === "corroborated"
      ? "border-sky-200 bg-sky-50/70"
      : lane === "chat"
        ? "border-amber-200 bg-amber-50/60"
        : "border-gray-200 bg-gray-50/60";
  const chatOnly = topic.chatSignals.chat_only_programs ?? [];

  function expandDetail() {
    setOpen(true);
  }

  function collapseDetail() {
    setOpen(false);
    setShowAll(false);
  }

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex gap-4">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[13px] font-semibold text-gray-500 tabular-nums"
          aria-hidden
        >
          {topic.rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h2 className="text-[16px] font-semibold text-ink leading-snug">{topic.temaLabel}</h2>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border max-w-[200px] sm:max-w-none text-right leading-snug ${mom.className}`}
              title={topic.momentumHint}
            >
              {topic.momentumLabel}
            </span>
          </div>

          <p className="text-[11.5px] text-gray-500 mb-2 leading-relaxed max-w-xl">
            {topic.momentumHint}
          </p>

          {(lane === "corroborated" ||
            lane === "chat" ||
            chatOnly.length > 0 ||
            topic.chatSignals.n_authors >= 2) &&
          isEvidenceLane(lane) ? (
            <div className={`rounded-lg border px-3.5 py-2.5 mb-3 ${laneStyle}`}>
              <p className="text-[12px] font-semibold text-ink mb-0.5">
                {EVIDENCE_LANE_LABEL[lane]}
                {topic.chatSignals.n_authors > 0
                  ? ` · ${topic.chatSignals.n_authors} personas en chat`
                  : null}
              </p>
              <p className="text-[11.5px] text-gray-600 leading-relaxed">
                {EVIDENCE_LANE_HINT[lane]}
              </p>
              {chatOnly.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
                  {chatOnly.slice(0, 3).map((p) => (
                    <li key={p.video_id}>
                      <span className="font-medium text-gray-700">{p.channel}</span>
                      {`: ${p.n_authors} autores, ${p.n_msgs} msgs`}
                      {p.ejemplo ? ` — «${p.ejemplo.slice(0, 72)}…»` : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {lane !== "audio" ? (
                <p className="text-[10.5px] text-gray-400 mt-2 italic">{CHAT_DISCLAIMER}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500 mb-1">
            <span title="Bloques de 10 min del programa donde apareció el tema">
              {mencionesLabel(topic)}
            </span>
            {topic.categoria ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="capitalize">{topic.categoria}</span>
              </>
            ) : null}
            {topic.mergedCluster ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">variantes unificadas</span>
              </>
            ) : null}
          </div>
          <p className="text-[11px] text-gray-400 mb-3">
            El número total cuenta cada tramo del programa; abajo ves citas de qué se dijo, con link
            al minuto exacto.
          </p>

          {topic.variantesRelacionadas.length > 0 && (
            <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
              También como:{" "}
              {topic.variantesRelacionadas.slice(0, 5).map(titleLabel).join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {topic.canales.map((ch) => {
              const slug = channelSlug(ch);
              const inner = (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                  {ch}
                </span>
              );
              return slug ? (
                <Link key={ch} href={`/canales/${slug}`} className="hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                <span key={ch}>{inner}</span>
              );
            })}
            {topic.crossComunidad ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft/40 text-accent font-medium">
                Varios streams
              </span>
            ) : null}
          </div>

          {showGoogleTrends && isGtStatus(topic.gtStatus) ? (
            <div className="rounded-lg border border-violet-200/80 bg-violet-50/50 px-3.5 py-3 mb-3">
              <p className="text-[12px] font-semibold text-violet-950 mb-1">
                {GT_STATUS_LABEL[topic.gtStatus]}
                {topic.gtLeadDays != null && topic.gtLeadDays > 0
                  ? ` · ~${topic.gtLeadDays} días de ventaja`
                  : null}
              </p>
              <p className="text-[12px] text-gray-700 leading-relaxed">
                {GT_STATUS_HINT[topic.gtStatus]}
              </p>
            </div>
          ) : null}

          <div className="flex items-end gap-3 mb-1">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${topic.scorePct}%` }}
                title={`Qué tan arriba está vs el resto del ranking (${topic.score})`}
              />
            </div>
            {spark.length > 1 ? (
              <div
                className="flex items-end gap-0.5 h-6"
                title="Menciones por día (últimos puntos del período)"
                aria-hidden
              >
                {spark.map((p, i) => (
                  <div
                    key={`${p.date}-${i}`}
                    className="w-1.5 rounded-sm bg-gray-300"
                    style={{ height: `${Math.max(15, (p.n / sparkMax) * 100)}%` }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {hasDetail ? (
            <button
              type="button"
              onClick={() => (open ? collapseDetail() : expandDetail())}
              className="text-[12.5px] text-accent font-medium hover:underline mt-2"
              aria-expanded={open}
            >
              {open
                ? "Ocultar citas"
                : multiChannel
                  ? `Ver cómo lo charlaron en cada canal (${exampleCount} citas)`
                  : `Ver qué se dijo (${exampleCount} citas)`}
            </button>
          ) : (
            <p className="text-[12px] text-gray-400 mt-2">
              Todavía no hay más detalle de este tema en lo que tenemos hoy.
            </p>
          )}

          {open && topic.highlights.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  {multiChannel ? "Citas por canal" : "Qué se dijo"}
                </h3>
                <span className="text-[11px] text-gray-400">
                  {showAll
                    ? `${topic.highlights.length} citas`
                    : `Mostrando ${visibleHighlights.length} de ${topic.highlights.length}`}
                  {topic.menciones > topic.highlightsTotal
                    ? ` · ${topic.menciones} apariciones en total`
                    : ""}
                </span>
              </div>

              {multiChannel && !showAll ? (
                <div className="flex flex-col gap-6">
                  {groupHighlightsByChannel(visibleHighlights, topic.canales).map(
                    ({ channel, items }) => {
                      const slug = channelSlug(channel);
                      return (
                        <section key={channel}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {slug ? (
                              <Link
                                href={`/canales/${slug}`}
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border hover:opacity-80 ${channelBadgeClass(channel)}`}
                              >
                                {channel}
                              </Link>
                            ) : (
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${channelBadgeClass(channel)}`}
                              >
                                {channel}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400">
                              {items.length} {items.length === 1 ? "cita" : "citas"}
                            </span>
                          </div>
                          <ul className="flex flex-col gap-3">
                            {items.map((h, i) => (
                              <HighlightCard
                                key={`${h.video_id}-${h.contexto.slice(0, 24)}-${i}`}
                                h={h}
                                topicTema={topic.tema}
                                index={i}
                              />
                            ))}
                          </ul>
                        </section>
                      );
                    }
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {visibleHighlights.map((h, i) => (
                    <HighlightCard
                      key={`${h.video_id}-${i}`}
                      h={h}
                      topicTema={topic.tema}
                      index={i}
                    />
                  ))}
                </ul>
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-3 text-[12.5px] text-accent font-medium hover:underline"
                >
                  Ver {hiddenCount} cita{hiddenCount === 1 ? "" : "s"} más
                </button>
              )}

              {topic.highlightsTotal > topic.highlights.length && (
                <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                  Hay {topic.highlightsTotal - topic.highlights.length} ángulos más en el período;
                  mostramos los más representativos por canal e intensidad.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
