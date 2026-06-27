"use client";

import type { ProgramTopicsRow } from "@/lib/placement";
import { categoryLabel } from "@/lib/placement";

type Props = {
  topics: ProgramTopicsRow;
};

export default function ProgramTopicsPanel({ topics }: Props) {
  const hasTemas = topics.top_temas.length > 0;
  const hasCats = topics.categorias.length > 0;

  if (!hasTemas && !topics.samples.length) {
    return (
      <section className="mb-8">
        <h2 className="text-[15px] font-semibold mb-3">De qué se habló</h2>
        <div className="card p-5 max-w-2xl">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Todavía no hay temas extraídos del audio para esta emisión en el export actual.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold mb-1">De qué se habló</h2>
      <p className="text-[13px] text-gray-500 mb-4 max-w-2xl">
        Temas del conductor en esta emisión — audio transcrito, no chat ni pauta.{" "}
        <span className="text-gray-400">
          Formato: {topics.show_name}
        </span>
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
                <span className="text-gray-400 tabular-nums shrink-0">{t.score} pts</span>
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
              <li key={i} className="px-5 py-4">
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
