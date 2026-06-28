"use client";

import { compact } from "@/lib/format";
import type { ChannelAudienceRow } from "@/lib/agencia-audiencia";
import { channelAudienceSummary, formatRubroEnCanal } from "@/lib/agencia-audiencia";

type Props = {
  rows: ChannelAudienceRow[];
  highlightIds?: string[];
  rubroLabel?: string;
};

const POSITIONING_STYLE: Record<
  ChannelAudienceRow["positioning"],
  { label: string; className: string }
> = {
  escala: { label: "Escala", className: "bg-accent-soft text-accent border-accent/20" },
  nicho: { label: "Nicho", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  emergente: { label: "Emergente", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function AgenciaCanalesAudiencia({
  rows,
  highlightIds = [],
  rubroLabel,
}: Props) {
  const highlight = new Set(highlightIds);
  const summary = channelAudienceSummary(rows, rubroLabel ?? null);

  return (
    <div className="space-y-4">
      {summary && (
        <p className="text-[14px] text-gray-700 leading-relaxed font-medium">{summary}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((row) => {
          const style = POSITIONING_STYLE[row.positioning];
          const isHighlight = highlight.has(row.id);
          return (
            <article
              key={row.id}
              className={`rounded-xl border p-4 ${
                isHighlight ? "border-accent/40 bg-accent-soft/25" : "border-[#ececec] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">{row.name}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{row.genre}</p>
                </div>
              </div>

              <p className="text-[28px] font-bold tabular-nums text-ink leading-none">
                {compact(row.peakConcurrent)}
                <span className="text-[13px] font-normal text-gray-500 ml-1.5">pico mirando</span>
              </p>
              <p className="text-[12px] text-gray-500 mt-1 tabular-nums">
                ~{compact(row.avgConcurrent)} promedio · {row.chatLabel}
              </p>

              {rubroLabel && (
                <p
                  className={`text-[12px] mt-2 ${
                    row.rubroPlacas > 0 ? "text-accent font-medium" : "text-gray-400"
                  }`}
                >
                  {formatRubroEnCanal(row.rubroPlacas, rubroLabel)}
                </p>
              )}

              {row.topProgramName && row.topProgramPeak != null && row.topProgramPeak > 0 && (
                <p className="text-[11px] text-gray-600 mt-2 leading-snug">
                  Programa más fuerte: <strong>{row.topProgramName}</strong> ·{" "}
                  {compact(row.topProgramPeak)} mirando
                </p>
              )}

              <p className="text-[11px] text-gray-400 mt-2 leading-snug">{row.positioningNote}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
