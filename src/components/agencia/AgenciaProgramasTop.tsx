import { compact } from "@/lib/format";
import type { ProgramMapRow } from "@/lib/agencia-mapa";

type Props = {
  programs: ProgramMapRow[];
  limit?: number;
};

export default function AgenciaProgramasTop({ programs, limit = 5 }: Props) {
  const top = programs.slice(0, limit);
  if (!top.length) {
    return <p className="text-[13px] text-gray-500">Sin programas con data este período.</p>;
  }

  return (
    <div className="space-y-2">
      {top.map((row, i) => (
        <article
          key={row.id}
          className={`rounded-xl border px-4 py-3 ${
            row.rubroAbsent
              ? "border-accent/30 bg-accent-soft/25"
              : "border-[#ececec] bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400">{row.channelName}</p>
              <p className="text-[14px] font-semibold text-ink mt-0.5 truncate">{row.showName}</p>
              {row.topTemas.length > 0 && (
                <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">
                  Hablan de {row.topTemas.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[15px] font-semibold tabular-nums text-ink">
                {compact(row.peakAttention)}
              </p>
              <p className="text-[10px] text-gray-400">mirando</p>
            </div>
          </div>
          {row.gapLabel && (
            <p className="text-[12px] text-accent font-medium mt-2">{row.gapLabel}</p>
          )}
          {row.rubroAbsent && i === 0 && (
            <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold text-accent">
              Oportunidad · tu rubro casi no aparece acá
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
