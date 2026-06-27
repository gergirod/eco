"use client";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import { useDataset } from "@/lib/useDataset";
import { num, compact } from "@/lib/format";
import {
  CHAT_ENGAGEMENT_DEFINITION,
  formatChatEngagementShort,
  formatChatEngagementValue,
  formatChatParticipationSummary,
  formatProgramChatParticipation,
} from "@/lib/coverage";

export default function AudienciaPage() {
  const audience = useDataset<any[]>("audience");
  const maxAvg = Math.max(...audience.map((a) => a.avg_concurrent), 1);
  const totalPeak = Math.max(...audience.map((a) => a.peak_concurrent), 0);

  return (
    <div>
      <PageHeader
        title="Calidad de audiencia"
        sub="Concurrentes reales minuto a minuto y cuánto participa la sala en el chat."
      />

      <p className="text-[12.5px] text-gray-500 mb-6 max-w-3xl leading-relaxed">{CHAT_ENGAGEMENT_DEFINITION}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Canales con audiencia" value={audience.length} hint="series capturadas" />
        <Stat label="Pico máximo" value={compact(totalPeak)} hint="concurrentes en un minuto" />
        <Stat
          label="Más participación en chat"
          value={
            audience.reduce((b, a) => (a.chat_msgs_per_1k_min || 0) > (b.chat_msgs_per_1k_min || 0) ? a : b, audience[0])?.name || "—"
          }
          hint="mensajes/min por cada 1.000 mirando"
        />
      </div>

      <div className="flex flex-col gap-4">
        {audience.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[16px] font-semibold">{a.name}</h2>
                <div className="text-[12px] text-gray-400 mt-0.5">{a.videos} programas con audiencia capturada</div>
              </div>
              {a.chat_writers_per_1k != null ? (
                <Badge tone="green">
                  {a.chat_writers_avg?.toLocaleString("es-AR")} escribieron ·{" "}
                  {formatChatEngagementValue(a.chat_writers_per_1k)}/1.000 mirando
                </Badge>
              ) : a.chat_msgs_per_1k_min != null ? (
                <Badge tone="green">{formatChatEngagementShort(a.chat_msgs_per_1k_min)}</Badge>
              ) : (
                <Badge tone="gray">chat no capturado</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Mirando</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{num(a.avg_concurrent)}</div>
                <div className="text-[11px] text-gray-400">concurrentes prom.</div>
                <div className="mt-1.5"><Bar value={a.avg_concurrent} max={maxAvg} /></div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Pico</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{num(a.peak_concurrent)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Cobertura chat</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{a.chat_coverage}%</div>
                <div className="text-[11px] text-gray-400">de los programas</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Escribieron</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">
                  {a.chat_writers_avg != null ? a.chat_writers_avg.toLocaleString("es-AR") : "s/d"}
                </div>
                <div className="text-[11px] text-gray-400">cuentas/emisión con chat</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Relación</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">
                  {a.chat_writers_per_1k != null
                    ? formatChatEngagementValue(a.chat_writers_per_1k)
                    : "s/d"}
                </div>
                <div className="text-[11px] text-gray-400">escribieron por 1.000 mirando</div>
              </div>
            </div>

            {formatChatParticipationSummary({
              avgWatching: a.chat_avg_concurrent ?? a.avg_concurrent,
              avgWriters: a.chat_writers_avg,
              writersPer1k: a.chat_writers_per_1k,
              msgsPerMinPer1k: a.chat_msgs_per_1k_min,
            }) && a.chat_coverage !== 0 ? (
              <p className="text-[12.5px] text-gray-600 mb-4 leading-relaxed">
                {formatChatParticipationSummary({
                  avgWatching: a.chat_avg_concurrent ?? a.avg_concurrent,
                  avgWriters: a.chat_writers_avg,
                  writersPer1k: a.chat_writers_per_1k,
                  msgsPerMinPer1k: a.chat_msgs_per_1k_min,
                })}
              </p>
            ) : null}

            <div className="border-t border-[#f0f0f0] pt-3">
              <div className="text-[12px] font-medium text-gray-500 mb-2">Top programas por pico</div>
              <div className="flex flex-col gap-1.5">
                {a.top_programs.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <a
                      href={`https://www.youtube.com/watch?v=${p.video_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-700 hover:text-accent hover:underline truncate max-w-[560px]"
                    >
                      {p.title || p.video_id}
                    </a>
                    <span className="tabular-nums text-gray-400">{compact(p.peak)}</span>
                  </div>
                ))}
              </div>
            </div>

            {a.top_programs_by_chat && a.top_programs_by_chat.length > 0 && (
              <div className="border-t border-[#f0f0f0] pt-3 mt-3">
                <div className="text-[12px] font-medium text-gray-500 mb-2">
                  Programas donde más escribe la sala
                </div>
                <div className="flex flex-col gap-1.5">
                  {a.top_programs_by_chat.map((p, i: number) => {
                    const chatLine = formatProgramChatParticipation(p);
                    return (
                      <div key={i} className="flex items-start justify-between gap-4 text-[13px]">
                        <a
                          href={`https://www.youtube.com/watch?v=${p.video_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-700 hover:text-accent hover:underline truncate max-w-[560px]"
                        >
                          {p.title || p.video_id}
                        </a>
                        <div className="tabular-nums text-gray-400 shrink-0 text-right max-w-[14rem] leading-snug">
                          <div>{chatLine.primary}</div>
                          {chatLine.secondary ? (
                            <div className="text-[11.5px] text-gray-400 mt-0.5">{chatLine.secondary}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        {CHAT_ENGAGEMENT_DEFINITION} Así podés comparar calidad de sala entre canales, no solo cuánta
        gente miraba.
      </p>
    </div>
  );
}
