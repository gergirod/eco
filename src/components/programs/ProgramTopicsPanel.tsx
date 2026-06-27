"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ProgramTopicsRow } from "@/lib/placement";
import { categoryLabel } from "@/lib/placement";
import { fmtHMS } from "@/lib/format";

type Props = {
  topics: ProgramTopicsRow;
  /** Segundos en el VOD — scroll y resalta el tramo más cercano. */
  focusSeconds?: number;
};

function minuteToSeconds(minute: string): number | null {
  const parts = minute.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function ProgramTopicsPanel({ topics, focusSeconds = 0 }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const hasTemas = topics.top_temas.length > 0;
  const hasCats = topics.categorias.length > 0;
  const focusIdx =
    focusSeconds > 0
      ? topics.samples.findIndex((s) => {
          if (!s.minute) return false;
          const sec = minuteToSeconds(s.minute);
          if (sec == null) return false;
          return Math.abs(sec - focusSeconds) < 600;
        })
      : -1;

  useEffect(() => {
    if (focusSeconds > 0 && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusSeconds]);

  if (!hasTemas && !topics.samples.length) {
    return (
      <section className="mb-8">
        <h2 className="text-[15px] font-semibold mb-3">De qué se habló</h2>
        <div className="card p-5 max-w-2xl">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Todavía no tenemos temas de esta emisión — cuando la procesemos, aparecen acá.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="charla" className="mb-8 scroll-mt-24">
      <h2 className="text-[15px] font-semibold mb-1">De qué se habló</h2>
      {focusSeconds > 0 ? (
        <p className="text-[12.5px] text-accent font-medium mb-2">
          Te trajimos al tramo ~{fmtHMS(focusSeconds)} de esta emisión.
        </p>
      ) : null}
      <p className="text-[13px] text-gray-500 mb-4 max-w-2xl">
        Lo que dijeron los conductores en este vivo — no es lo que escribió la sala ni marcas
        pautando.{" "}
        <span className="text-gray-400">Show: {topics.show_name}</span>
      </p>

      {hasTemas ? (
        <div className="card p-5 mb-4 max-w-2xl">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Temas principales
          </h3>
          <ul className="space-y-2">
            {topics.top_temas.map((t) => (
              <li key={t.tema} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-gray-800 font-medium">{t.tema}</span>
                <span className="text-gray-400 tabular-nums shrink-0 text-[12px]">{t.score}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasCats ? (
        <div className="flex flex-wrap gap-2 mb-4 max-w-2xl">
          {topics.categorias.map((c) => (
            <span
              key={c.categoria}
              className="text-[12px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100"
            >
              {categoryLabel(c.categoria)}
            </span>
          ))}
        </div>
      ) : null}

      {topics.samples.length > 0 ? (
        <div className="card overflow-hidden max-w-2xl">
          <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Ejemplos de la charla
            </h3>
          </div>
          <ul className="divide-y divide-[#ececec]">
            {topics.samples.map((s, i) => (
              <li
                key={i}
                className={`px-5 py-4 ${i === focusIdx ? "bg-accent-soft/30 ring-1 ring-inset ring-accent/20" : ""}`}
              >
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <span className="text-[13px] font-medium text-ink">{s.tema}</span>
                  {s.minute ? (
                    <span className="text-[11px] text-gray-400">min {s.minute}</span>
                  ) : null}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed border-l-2 border-accent/30 pl-3">
                  {s.contexto}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
