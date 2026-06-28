"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaCorpusChannels from "@/components/agencia/AgenciaCorpusChannels";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { SHOWCASES } from "@/lib/agencia-showcase";
import { buildCorpusChannelMatrix } from "@/lib/corpus-channels";
import { useCorpus } from "@/lib/useCorpus";
import { compact } from "@/lib/format";

const CHANNEL_LABELS: Record<string, string> = {
  olga: "Olga",
  luzu: "Luzu",
  blend: "Blender",
  neura: "Neura",
  vorterix: "Vorterix",
  bondi: "Bondi",
  gelatina: "Gelatina",
  urbana: "Urbana",
};

export default function AgenciaEjemploHubPage() {
  const { reports, channels, brands, meta } = useCorpus([
    "reports",
    "channels",
    "brands",
    "meta",
  ] as const);
  const reportsMap = reports as Record<string, { mentions?: number; best?: { conc_at?: number } }>;

  const corpusRows = useMemo(
    () => buildCorpusChannelMatrix(meta as never, channels as never, brands as never),
    [meta, channels, brands]
  );

  const cards = useMemo(
    () =>
      SHOWCASES.map((s) => {
        const client = reportsMap[s.clientSlug];
        const competitor = reportsMap[s.competitorSlug];
        const peak = client?.best?.conc_at ?? 0;
        return {
          ...s,
          clientPnt: client?.mentions ?? 0,
          competitorPnt: competitor?.mentions ?? 0,
          peak,
        };
      }),
    [reports]
  );

  return (
    <div className="pb-14 max-w-3xl">
      <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">
        Design partner
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">6 ejemplos · corpus completo</h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed max-w-xl">
        No solo Olga y Luzu: cada demo es un par marca + competidor con canales reales del export —
        escala masiva y nichos directos (Blender, Neura, Vorterix).
      </p>

      <div className="mt-8">
        <AgenciaCorpusChannels rows={corpusRows} meta={meta as never} />
      </div>

      <div className="mt-8 grid gap-4">
        {cards.map((c, i) => (
          <Link
            key={c.id}
            href={`${AGENCIA_BASE}/ejemplo/${c.id}`}
            className="card p-5 block hover:border-accent/40 hover:shadow-md transition-all group"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                  Ejemplo {i + 1} · {c.rubro}
                </span>
                <h2 className="text-[18px] font-semibold text-ink group-hover:text-accent transition-colors mt-1">
                  {c.title}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1">{c.hook}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.channelIds.map((ch) => (
                    <span
                      key={ch}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {CHANNEL_LABELS[ch] ?? ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                {c.peak > 0 && (
                  <div className="text-[20px] font-semibold text-ink tabular-nums">
                    {compact(c.peak)}
                  </div>
                )}
                <div className="text-[11px] text-gray-400">pico conc.</div>
              </div>
            </div>
            <p className="text-[12px] text-gray-500 mt-3">
              <span className="text-accent font-medium">{c.clientPnt} PNT</span> tu marca ·{" "}
              <span className="text-amber-800 font-medium">{c.competitorPnt} PNT</span> rival
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 card p-5 bg-gray-50 text-[13px] text-gray-600 leading-relaxed space-y-2">
        <p>
          <strong className="text-ink">Cuál elegir:</strong> fintech → IOL/MP · energía cross-canal →
          YPF/PAE · rock/cultura → Hyundai/Adidas · CPG → Skip/Rexona · viajes wow → Wanderlust ·
          OTC → Geniol/Green Life.
        </p>
        <p>
          <strong className="text-ink">Escala vs nicho:</strong> si el cliente busca volumen, empezá
          por IOL o Wanderlust. Si busca audiencia más directa y slot más barato, YPF en Blender o PAE
          en Neura.
        </p>
      </div>
    </div>
  );
}
