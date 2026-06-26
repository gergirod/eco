"use client";

import type { AudienceDemandMeta } from "@/lib/audienceDemand";
import { demandSummary, demandTipoLabel, getAudienceDemand } from "@/lib/audienceDemand";

type Props = {
  moment: AudienceDemandMeta | null;
};

export default function AudienceDemandPanel({ moment }: Props) {
  const hasChat = moment?.has_chat !== false;
  const items = getAudienceDemand(moment);
  const summary = demandSummary(moment);

  if (!hasChat) {
    return (
      <section className="mb-8">
        <h2 className="text-[15px] font-semibold mb-3">Lo que pidió la audiencia</h2>
        <div className="card p-5 max-w-2xl">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Sin chat capturado en este programa — no podemos extraer demanda de la audiencia
            (YouTube no disponible en este canal o emisión sin replay de chat).
          </p>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mb-8">
        <h2 className="text-[15px] font-semibold mb-3">Lo que pidió la audiencia</h2>
        <div className="card p-5 max-w-2xl">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Hay chat en este programa, pero no detectamos pedidos o señales de demanda claras en la
            ventana analizada — la conversación fue mayormente reacción general, no solicitudes
            concretas.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold mb-1">Lo que pidió la audiencia</h2>
      <p className="text-[13px] text-gray-500 mb-4 max-w-2xl">
        Señales del chat en esta emisión — lo que la sala pidió o repitió.{" "}
        <span className="text-gray-400">No es pauta ni certifica marcas.</span>
      </p>
      {summary && (
        <p className="text-[14px] text-gray-700 mb-4 leading-relaxed max-w-2xl">{summary}</p>
      )}
      <div className="card overflow-hidden">
        <ol className="divide-y divide-[#ececec]">
          {items.map((item, i) => (
            <li key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-1.5">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                    {demandTipoLabel(item.tipo)}
                    {item.minute ? ` · min ${item.minute}` : ""}
                  </div>
                  <div className="text-[14px] font-medium text-ink leading-snug">{item.tema}</div>
                </div>
                {item.n > 1 && (
                  <span className="text-[11px] text-gray-400 tabular-nums shrink-0 pt-1">
                    ×{item.n} bloques
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-600 italic leading-relaxed">
                “{item.evidencia.length > 140 ? `${item.evidencia.slice(0, 137)}…` : item.evidencia}”
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
