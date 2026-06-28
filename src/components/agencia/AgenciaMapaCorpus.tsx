"use client";

import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import type { ProgramMapRow, RubroCompetitorRow } from "@/lib/agencia-mapa";
import { compact } from "@/lib/format";
import type { RubroGapHint } from "@/lib/opportunity";

type Props = {
  rubro: string;
  rubroLabel: string;
  rubroOptions: { id: string; label: string }[];
  onRubroChange: (id: string) => void;
  competitors: RubroCompetitorRow[];
  programs: ProgramMapRow[];
  rubroGaps: RubroGapHint[];
};

export default function AgenciaMapaCorpus({
  rubro,
  rubroLabel,
  rubroOptions,
  onRubroChange,
  competitors,
  programs,
  rubroGaps,
}: Props) {
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="mapa-rubro" className="text-[13px] text-gray-600 shrink-0">
          Filtrar por rubro
        </label>
        <select
          id="mapa-rubro"
          value={rubro}
          onChange={(e) => onRubroChange(e.target.value)}
          className="text-[13px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-ink min-w-[220px]"
        >
          {rubroOptions.map((o) => (
            <option key={o.id || "all"} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {rubro && (
          <span className="text-[12px] text-gray-400">
            Competencia, temas y huecos en {rubroLabel.toLowerCase()}
          </span>
        )}
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Competencia en streaming</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              Marcas con PNT verificada en el corpus — dónde aparecen y en qué programas.
            </p>
          </div>
          <span className="text-[12px] text-gray-400 shrink-0">{competitors.length} marcas</span>
        </div>
        {competitors.length === 0 ? (
          <p className="text-[13px] text-gray-500 card p-4">Sin marcas de este rubro en el período.</p>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-2.5 font-medium">Marca</th>
                    <th className="px-4 py-2.5 font-medium">PNT</th>
                    <th className="px-4 py-2.5 font-medium">Canales</th>
                    <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Programas</th>
                    <th className="px-4 py-2.5 font-medium text-right">Pico</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((row) => (
                    <tr key={row.slug} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`${AGENCIA_BASE}/marcas/${row.slug}`}
                            className="font-semibold text-ink hover:text-accent"
                          >
                            {row.name}
                          </Link>
                          {row.role !== "rubro" && <AgenciaBrandRoleBadge role={row.role} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-700">{row.mentions}</td>
                      <td className="px-4 py-3 text-gray-600">{row.channelLabel || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-[240px]">
                        <span className="line-clamp-2">{row.programs.slice(0, 3).join(" · ") || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {row.peakConc > 0 ? compact(row.peakConc) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Programas · temas · oportunidad</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              De qué se habla en cada show, qué marcas del rubro ya pautan, y dónde hay hueco con
              audiencia.
            </p>
          </div>
          <span className="text-[12px] text-gray-400 shrink-0">{programs.length} programas</span>
        </div>
        <div className="grid gap-3">
          {programs.map((row) => (
            <article
              key={row.id}
              className={`card p-4 ${row.rubroAbsent ? "border-dashed border-accent/30 bg-accent-soft/20" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-gray-400">{row.channelName}</p>
                  <h3 className="text-[15px] font-semibold text-ink mt-0.5">{row.showName}</h3>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-semibold tabular-nums text-ink">
                    {compact(row.peakAttention)}
                  </p>
                  <p className="text-[10px] text-gray-400">pico conc.</p>
                </div>
              </div>

              {row.topTemas.length > 0 && (
                <p className="text-[12.5px] text-gray-600 mt-3">
                  <span className="text-gray-400">Temas: </span>
                  {row.topTemas.join(" · ")}
                </p>
              )}
              {(row.charlaAngle || row.brandsInRubro.length > 0) && (
                <p className="text-[12px] text-gray-500 mt-1.5">
                  {row.charlaAngle ? `Charla ${row.charlaAngle.toLowerCase()}` : null}
                  {row.charlaAngle && row.brandsInRubro.length ? " · " : null}
                  {row.brandsInRubro.length ? `Pauta: ${row.brandsInRubro.join(", ")}` : null}
                </p>
              )}
              {row.gapLabel && (
                <p className="text-[12px] text-accent font-medium mt-2">{row.gapLabel}</p>
              )}
              {row.rubroAbsent && rubro && (
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold text-accent bg-white/80 px-2 py-0.5 rounded border border-accent/20">
                  Oportunidad · rubro ausente
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      {rubroGaps.length > 0 && (
        <section className="card p-5">
          <h2 className="text-[16px] font-semibold text-ink mb-1">Huecos por rubro</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            Shows con buena audiencia donde un rubro fuerte del canal casi no aparece.
          </p>
          <div className="divide-y divide-gray-100">
            {rubroGaps.map((hint) => (
              <p key={hint.id} className="py-3 text-[13px] text-gray-700 leading-relaxed">
                {hint.summary}
                <span className="block text-[11px] text-gray-400 mt-1">
                  Pico {compact(hint.peakAttention)}
                </span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
