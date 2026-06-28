import type { RubroShareRow } from "@/lib/agencia-product";

type Props = {
  rubroLabel: string;
  rows: RubroShareRow[];
  highlightSlugs: string[];
};

export default function AgenciaRubroPulse({ rubroLabel, rows, highlightSlugs }: Props) {
  const top = rows.slice(0, 6);
  const max = Math.max(...top.map((r) => r.sharePct), 1);

  return (
    <section className="card p-5">
      <h2 className="text-[14px] font-semibold mb-1">Pulso {rubroLabel}</h2>
      <p className="text-[12px] text-gray-500 mb-4">
        Share de exposición estimada (atención × formato) en el período capturado
      </p>
      <div className="space-y-3">
        {top.map((row) => {
          const isHighlight = highlightSlugs.includes(row.slug);
          const roleLabel =
            row.role === "cliente" ? "Tu marca" : row.role === "competidor" ? "Competidor" : null;
          const barColor =
            row.role === "cliente"
              ? "bg-accent"
              : row.role === "competidor"
                ? "bg-amber-500"
                : "bg-gray-300";
          return (
            <div key={row.slug}>
              <div className="flex justify-between text-[13px] mb-1">
                <span className={isHighlight ? "font-semibold text-ink" : "text-gray-700"}>
                  {row.name}
                  {roleLabel ? (
                    <span
                      className={`ml-2 text-[10px] uppercase tracking-wide font-medium ${
                        row.role === "competidor" ? "text-amber-700" : "text-accent"
                      }`}
                    >
                      {roleLabel}
                    </span>
                  ) : null}
                </span>
                <span className="text-gray-400 tabular-nums">
                  {row.sharePct.toFixed(0)}% · {row.mentions} placas
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${(row.sharePct / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
