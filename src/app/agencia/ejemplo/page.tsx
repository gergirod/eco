"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { SHOWCASES } from "@/lib/agencia-showcase";
import { useCorpus } from "@/lib/useCorpus";
import { compact } from "@/lib/format";

export default function AgenciaEjemploHubPage() {
  const { reports } = useCorpus(["reports"] as const);
  const reportsMap = reports as Record<string, { mentions?: number; best?: { conc_at?: number } }>;

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
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">4 ejemplos reales</h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed max-w-xl">
        Cada demo es un par marca + competidor del corpus — mismo producto que vería la agencia con
        sus clientes. Elegí el rubro que encaje con la call.
      </p>

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

      <div className="mt-10 card p-5 bg-gray-50 text-[13px] text-gray-600 leading-relaxed">
        <strong className="text-ink">Cuál elegir:</strong> fintech → IOL/MP · viajes → Wanderlust ·
        CPG higiene → Skip/Rexona · salud/OTC → Geniol/Green Life.
      </div>
    </div>
  );
}
