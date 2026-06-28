"use client";

import AgenciaQuestionBlock from "@/components/agencia/AgenciaQuestionBlock";
import type { RubroIntelPack } from "@/lib/agencia-rubro-intel";

type Props = {
  pack: RubroIntelPack;
  rubroLabel: string;
};

export default function AgenciaDemandaView({ pack, rubroLabel }: Props) {
  const hasSignals =
    pack.commercialSignals.length > 0 || Boolean(pack.chatLine);
  const rubroLower = rubroLabel.toLowerCase();

  if (!hasSignals) {
    return (
      <div className="space-y-6">
        <AgenciaQuestionBlock question={`¿Dónde está pidiendo la gente ${rubroLower}?`}>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Esta semana no hubo picos de demanda en chat para {rubroLower}.
          </p>
          {pack.channelsWithoutChat.length > 0 && (
            <ul className="mt-4 space-y-2">
              {pack.channelsWithoutChat.map((ch) => (
                <li
                  key={ch}
                  className="rounded-xl border border-[#ececec] bg-gray-50 px-4 py-3 text-[13px] text-gray-600"
                >
                  En <strong className="text-ink">{ch}</strong> no capturamos chat esta semana — la
                  demanda acá es solo por placas.
                </li>
              ))}
            </ul>
          )}
          {!pack.channelsWithoutChat.length && (
            <p className="text-[13px] text-gray-500 mt-3">
              Suele aparecer en Olga y programas con sala activa.
            </p>
          )}
        </AgenciaQuestionBlock>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AgenciaQuestionBlock question={`¿Dónde está pidiendo la gente ${rubroLower}?`}>
        {pack.chatLine && (
          <p className="text-[14px] text-gray-700 leading-relaxed mb-4">{pack.chatLine}</p>
        )}
        <ul className="space-y-3">
          {pack.commercialSignals.map((s) => (
            <li
              key={s}
              className="rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px] text-gray-800 leading-relaxed"
            >
              {s}
            </li>
          ))}
        </ul>
        {pack.channelsWithoutChat.length > 0 && (
          <p className="text-[12px] text-gray-500 mt-4 leading-relaxed">
            {pack.channelsWithoutChat.join(" y ")} no tienen chat esta semana — en esos canales mirá
            solo placas y concurrentes.
          </p>
        )}
      </AgenciaQuestionBlock>
    </div>
  );
}
