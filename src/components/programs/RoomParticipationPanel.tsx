"use client";

import type { RoomParticipation } from "@/lib/roomReaction";
import { fmtDuration, fmtVotes, highlightLabel } from "@/lib/roomReaction";

type Props = {
  participation: RoomParticipation | null | undefined;
};

export default function RoomParticipationPanel({ participation }: Props) {
  if (!participation?.has_data) return null;

  const highlights = participation.highlights || [];

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold mb-1">La sala participó</h2>
      <p className="text-[12.5px] text-gray-500 mb-3 max-w-2xl">
        Encuestas nativas, mensajes fijados y señales de apoyo en el chat — medido en vivo, no en el
        replay de YouTube.
      </p>

      {participation.summary_line && (
        <p className="text-[13.5px] text-gray-800 mb-4 font-medium">{participation.summary_line}</p>
      )}

      {highlights.length > 0 ? (
        <ul className="card divide-y divide-[#ececec] overflow-hidden">
          {highlights.map((h, i) => (
            <li key={i} className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-accent shrink-0">
                {h.kind === "encuesta" ? "Encuesta" : "Mensaje fijado"}
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
          {participation.poll_count ? (
            <>
              <b>{participation.poll_count}</b> encuesta
              {participation.poll_count !== 1 ? "s" : ""}
              {participation.total_votes ? (
                <>
                  {" "}
                  · <b>{fmtVotes(participation.total_votes)}</b> votos en total
                </>
              ) : null}
              {participation.banner_sessions ? (
                <>
                  {" "}
                  · <b>{participation.banner_sessions}</b> mensaje
                  {participation.banner_sessions !== 1 ? "s" : ""} fijado
                  {participation.banner_sessions !== 1 ? "s" : ""}
                </>
              ) : null}
            </>
          ) : (
            "Participación capturada en esta emisión."
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-2">
        No incluye clicks de links. No certifica pauta — mide movimiento de la comunidad.
      </p>
    </section>
  );
}
