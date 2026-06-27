"use client";

import type { RoomParticipation } from "@/lib/roomReaction";
import { fmtDuration, fmtVotes, highlightLabel } from "@/lib/roomReaction";

function fmtMoney(totals: Record<string, number> | undefined): string | null {
  if (!totals || !Object.keys(totals).length) return null;
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cur, amt]) => (cur === "USD" ? `USD ${Math.round(amt).toLocaleString("es-AR")}` : `${cur} ${Math.round(amt).toLocaleString("es-AR")}`))
    .join(" · ");
}

type Props = {
  participation: RoomParticipation | null | undefined;
  chatTotal?: number | null;
};

export default function RoomParticipationPanel({ participation, chatTotal }: Props) {
  if (!participation?.has_data) return null;

  const highlights = participation.highlights || [];
  const moneyLine = fmtMoney(participation.total_by_currency);

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold mb-1">La sala participó</h2>
      <p className="text-[12.5px] text-gray-500 mb-3 max-w-2xl">
        Chat en vivo, encuestas, mensajes fijados y apoyo económico — medido en la emisión, no
        estimado.
      </p>

      {participation.summary_line && (
        <p className="text-[13.5px] text-gray-800 mb-4 font-medium">{participation.summary_line}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 max-w-2xl">
        {(participation.chat_messages ?? chatTotal ?? 0) > 0 ? (
          <div className="card px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Mensajes</p>
            <p className="text-[15px] font-semibold tabular-nums text-ink">
              {fmtVotes(participation.chat_messages ?? chatTotal ?? 0)}
            </p>
          </div>
        ) : null}
        {(participation.paid_events ?? 0) > 0 ? (
          <div className="card px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Apoyos</p>
            <p className="text-[15px] font-semibold tabular-nums text-ink">
              {participation.paid_events}
              {moneyLine ? (
                <span className="text-[11px] font-normal text-gray-500 block mt-0.5">{moneyLine}</span>
              ) : null}
            </p>
          </div>
        ) : null}
        {(participation.poll_count ?? 0) > 0 ? (
          <div className="card px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Encuestas</p>
            <p className="text-[15px] font-semibold tabular-nums text-ink">
              {participation.poll_count}
              {(participation.total_votes ?? 0) >= 100 ? (
                <span className="text-[11px] font-normal text-gray-500 block mt-0.5">
                  {fmtVotes(participation.total_votes!)} votos
                </span>
              ) : null}
            </p>
          </div>
        ) : null}
        {(participation.banner_sessions ?? 0) > 0 ? (
          <div className="card px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Fijados</p>
            <p className="text-[15px] font-semibold tabular-nums text-ink">
              {participation.banner_sessions}
            </p>
          </div>
        ) : null}
      </div>

      {highlights.length > 0 ? (
        <ul className="card divide-y divide-[#ececec] overflow-hidden">
          {highlights.map((h, i) => (
            <li key={i} className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-accent shrink-0">
                {h.kind === "encuesta"
                  ? "Encuesta"
                  : h.kind === "super_chat"
                    ? "Super chat"
                    : "Mensaje fijado"}
              </span>
              {h.minute != null && (
                <span className="text-[11px] text-gray-400 font-mono tabular-nums shrink-0">
                  min{" "}
                  {h.minute >= 60
                    ? `${Math.floor(h.minute / 60)}:${String(h.minute % 60).padStart(2, "0")}`
                    : `${h.minute}:00`}
                </span>
              )}
              <span className="text-[13px] text-gray-700 leading-snug">{highlightLabel(h)}</span>
              {h.kind === "encuesta" && h.winner && (
                <span className="text-[11.5px] text-gray-500">
                  Ganó: {h.winner}
                  {h.winner_pct ? ` (${h.winner_pct})` : ""}
                </span>
              )}
              {h.kind === "mensaje_fijado" && h.duration_s != null && (
                <span className="text-[11.5px] text-gray-500">{fmtDuration(h.duration_s)} visible</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card px-4 py-3 text-[13px] text-gray-600">
          Chat capturado en esta emisión — sin encuestas ni mensajes fijados detectados en el
          período.
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-2">
        No incluye likes del botón de YouTube ni clicks de links. No certifica pauta — mide
        movimiento de la comunidad.
      </p>
    </section>
  );
}
