"use client";

import Link from "next/link";
import { useState } from "react";
import type { ConversacionTopic } from "@/lib/conversacion";
import { CHANNEL_SLUG } from "@/lib/conversacion";
import { vodLink } from "@/lib/format";

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
};

const INITIAL_SHOWN = 6;

type Props = { topic: ConversacionTopic };

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

export default function ConversacionRow({ topic }: Props) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const mom = MOMENTUM_STYLE[topic.momentum];
  const spark = topic.serie.slice(-8);
  const sparkMax = Math.max(...spark.map((p) => p.n), 1);
  const hasDetail = topic.highlights.length > 0 || topic.variantesRelacionadas.length > 0;
  const visibleHighlights = showAll
    ? topic.highlights
    : topic.highlights.slice(0, INITIAL_SHOWN);
  const hiddenCount = topic.highlights.length - visibleHighlights.length;

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
            El número total cuenta cada tramo del programa; abajo ves resúmenes de qué se dijo.
          </p>

          {topic.variantesRelacionadas.length > 0 && (
            <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
              También como:{" "}
              {topic.variantesRelacionadas.slice(0, 5).map(titleLabel).join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {topic.canales.map((ch) => {
              const slug = CHANNEL_SLUG[ch];
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
                Cross-canal
              </span>
            ) : null}
          </div>

          <div className="flex items-end gap-3 mb-1">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${topic.scorePct}%` }}
                title={`Intensidad relativa: ${topic.score}`}
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
              onClick={() => {
                setOpen((v) => !v);
                if (open) setShowAll(false);
              }}
              className="text-[12.5px] text-accent font-medium hover:underline mt-2"
              aria-expanded={open}
            >
              {open
                ? "Ocultar qué se dijo"
                : `Ver qué se dijo (${Math.min(topic.highlights.length, topic.highlightsTotal)} ejemplos)`}
            </button>
          ) : (
            <p className="text-[12px] text-gray-400 mt-2">
              Sin contexto detallado en el export para este tema.
            </p>
          )}

          {open && topic.highlights.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  Qué se dijo
                </h3>
                <span className="text-[11px] text-gray-400">
                  Mostrando {visibleHighlights.length} de {topic.highlights.length} resúmenes
                  {topic.menciones > topic.highlightsTotal
                    ? ` · ${topic.menciones} apariciones en total`
                    : ""}
                </span>
              </div>

              <ul className="flex flex-col gap-3">
                {visibleHighlights.map((h, i) => (
                  <li
                    key={`${h.video_id}-${i}`}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-gray-50 border-b border-gray-100">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                          CHANNEL_STYLE[h.channel] || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {h.channel}
                      </span>
                      <span className="text-[10px] text-gray-400 tabular-nums">#{i + 1}</span>
                    </div>
                    <div className="px-3.5 py-3">
                      <a
                        href={vodLink(h.video_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] font-medium text-ink hover:text-accent leading-snug block mb-2"
                      >
                        {h.title || h.video_id}
                      </a>
                      {h.subtema && h.subtema.toLowerCase() !== topic.tema.toLowerCase() ? (
                        <div className="text-[11px] font-medium text-accent/90 mb-2">
                          {titleLabel(h.subtema)}
                        </div>
                      ) : null}
                      <p className="text-[13px] text-gray-700 leading-relaxed border-l-[3px] border-accent/40 pl-3 bg-gray-50/60 py-2 pr-2 rounded-r-md">
                        {h.contexto}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-3 text-[12.5px] text-accent font-medium hover:underline"
                >
                  Ver {hiddenCount} ejemplo{hiddenCount === 1 ? "" : "s"} más
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
