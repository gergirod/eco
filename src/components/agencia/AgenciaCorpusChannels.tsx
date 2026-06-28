"use client";

import { compact } from "@/lib/format";
import type { CorpusChannelRow } from "@/lib/corpus-channels";
import { corpusChannelSummary } from "@/lib/corpus-channels";

type Props = {
  rows: CorpusChannelRow[];
  meta: { live_capture?: { hours_captured?: number; capture_days?: number; channels_captured?: number } };
  highlightIds?: string[];
  title?: string;
};

const POSITIONING_STYLE: Record<
  CorpusChannelRow["positioning"],
  { label: string; className: string }
> = {
  escala: { label: "Escala", className: "bg-accent-soft text-accent border-accent/20" },
  nicho: { label: "Nicho directo", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  emergente: { label: "Emergente", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function AgenciaCorpusChannels({
  rows,
  meta,
  highlightIds = [],
  title = "8 canales en el corpus",
}: Props) {
  const highlight = new Set(highlightIds);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        <span className="text-[11px] text-gray-400">
          {meta.live_capture?.channels_captured ?? rows.length} capturados
        </span>
      </div>
      <p className="text-[12.5px] text-gray-500 mb-4 leading-relaxed">{corpusChannelSummary(rows, meta)}</p>
      <p className="text-[12px] text-gray-600 mb-4 leading-relaxed">
        Olga y Luzu concentran la mayoría de PNT — pero Blender, Neura y Vorterix tienen audiencia más
        acotada y a veces más barata por contacto. ECO te deja comparar escala vs nicho con el mismo
        minuto verificado.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {rows.map((row) => {
          const style = POSITIONING_STYLE[row.positioning];
          const isHighlight = highlight.has(row.id);
          return (
            <div
              key={row.id}
              className={`rounded-lg border px-3 py-2.5 ${
                isHighlight ? "border-accent/40 bg-accent-soft/30" : "border-gray-100 bg-gray-50/80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[13px] font-semibold text-ink">{row.name}</span>
                <span className={`text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${style.className}`}>
                  {style.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">{row.genre}</p>
              <p className="text-[11.5px] text-gray-600 mt-1.5 tabular-nums">
                {row.brandCount} marcas · {row.streams} emisiones · {row.hours.toFixed(1)}h
                {row.avgConcurrent != null && row.avgConcurrent > 0
                  ? ` · ~${compact(row.avgConcurrent)} avg`
                  : ""}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{row.positioningNote}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
