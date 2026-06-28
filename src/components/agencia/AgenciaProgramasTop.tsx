"use client";

import { compact } from "@/lib/format";
import type { ProgramMapRow } from "@/lib/agencia-mapa";

type Props = {
  programs: ProgramMapRow[];
  limit?: number;
  rubroLabel?: string;
};

export default function AgenciaProgramasTop({ programs, limit = 5, rubroLabel }: Props) {
  const top = programs.slice(0, limit);
  if (!top.length) {
    return (
      <p className="text-[13px] text-gray-500">
        Sin programas con audiencia medida para {rubroLabel?.toLowerCase() ?? "este rubro"} esta semana.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-600 leading-relaxed">
        Mismo canal, distinto programa — el pico de mirando cambia mucho. Elegí el slot, no solo el
        canal.
      </p>
      <div className="space-y-2">
        {top.map((row, i) => (
          <article
            key={row.id}
            className={`rounded-xl border px-4 py-3.5 ${
              row.rubroAbsent
                ? "border-accent/30 bg-accent-soft/20"
                : "border-[#ececec] bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">{row.channelName}</p>
                <p className="text-[15px] font-semibold text-ink mt-0.5 leading-snug">{row.showName}</p>
                {row.brandsInRubro.length > 0 && rubroLabel && (
                  <p className="text-[12px] text-gray-600 mt-1.5">
                    Pautó en {rubroLabel.toLowerCase()}: {row.brandsInRubro.slice(0, 4).join(", ")}
                    {row.brandsInRubro.length > 4 ? "…" : ""}
                  </p>
                )}
                {row.peakWindow && (
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Mejor franja: {row.peakWindow}
                  </p>
                )}
                {row.pautaMentions > 0 && (
                  <p className="text-[12px] text-gray-500 mt-0.5 tabular-nums">
                    {row.pautaMentions} {row.pautaMentions === 1 ? "placa" : "placas"} en el programa
                    esta semana
                  </p>
                )}
                {row.topTemas.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                    Hablan de {row.topTemas.slice(0, 3).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[22px] font-bold tabular-nums text-ink leading-none">
                  {compact(row.peakAttention)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">pico mirando</p>
              </div>
            </div>
            {row.gapLabel && (
              <p className="text-[12px] text-accent font-medium mt-2.5">{row.gapLabel}</p>
            )}
            {row.rubroAbsent && i === 0 && rubroLabel && (
              <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold text-accent">
                Oportunidad · poca pauta de {rubroLabel.toLowerCase()} acá
              </span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
