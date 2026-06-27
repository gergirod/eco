"use client";
import { PageHeader, Stat, Badge, Bar } from "@/components/ui";
import { useDataset } from "@/lib/useDataset";
import { num, compact } from "@/lib/format";

export default function AudienciaPage() {
  const audience = useDataset<any[]>("audience");
  const maxAvg = Math.max(...audience.map((a) => a.avg_concurrent), 1);
  const totalPeak = Math.max(...audience.map((a) => a.peak_concurrent), 0);

  return (
    <div>
      <PageHeader
        title="Audience Quality"
        sub="Concurrentes reales minuto a minuto. Contexto para defender CPM en el media kit y en los reportes de marca."
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Canales con audiencia" value={audience.length} hint="series capturadas" />
        <Stat label="Pico máximo" value={compact(totalPeak)} hint="concurrentes en un minuto" />
        <Stat
          label="Mejor engagement"
          value={
            audience.reduce((b, a) => (a.chat_msgs_per_1k_min || 0) > (b.chat_msgs_per_1k_min || 0) ? a : b, audience[0])?.name || "—"
          }
          hint="chat por 1k concurrentes"
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
              {a.chat_msgs_per_1k_min != null ? (
                <Badge tone="green">chat {a.chat_msgs_per_1k_min} / 1k concurrentes</Badge>
              ) : (
                <Badge tone="gray">chat no capturado</Badge>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Concurrentes prom.</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{num(a.avg_concurrent)}</div>
                <div className="mt-1.5"><Bar value={a.avg_concurrent} max={maxAvg} /></div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Pico</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{num(a.peak_concurrent)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Cobertura de chat</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">{a.chat_coverage}%</div>
                <div className="text-[11px] text-gray-400">de los programas</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Engagement</div>
                <div className="text-[19px] font-semibold tabular-nums mt-0.5">
                  {a.chat_msgs_per_1k_min != null ? a.chat_msgs_per_1k_min : "s/d"}
                </div>
                <div className="text-[11px] text-gray-400">msgs/1k/min</div>
              </div>
            </div>

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
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Audiencia concurrente medida minuto a minuto durante el vivo. El engagement (mensajes de chat
        por cada 1.000 concurrentes por minuto) distingue audiencia activa de audiencia pasiva — clave
        para defender CPM y comparar calidad entre canales, no solo tamaño.
      </p>
    </div>
  );
}
