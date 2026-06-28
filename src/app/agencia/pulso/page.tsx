"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaPairShowcase from "@/components/agencia/AgenciaPairShowcase";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { buildRubroShare, markCompetitorsInRubro } from "@/lib/agencia-product";
import { useCorpus } from "@/lib/useCorpus";

/** Rivales — share de atención, sin narrativa inventada. */
export default function AgenciaRivalesPage() {
  const { config } = useAgenciaConfig();
  const { brands, reports } = useCorpus(["brands", "reports"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const reportsMap = reports as Record<string, never>;

  const pairShowcases = useMemo(
    () =>
      config.pairs.map((pair) => {
        const compSlug = pair.competitorSlug;
        const rubroRows = markCompetitorsInRubro(
          buildRubroShare(pair.rubro, brands as never[], reportsMap, [
            pair.slug,
            ...(compSlug ? [compSlug] : []),
          ]),
          compSlug ? [compSlug] : config.competitorSlugs
        );
        return {
          pair,
          clientReport: reportsMap[pair.slug] as never,
          competitorReport: compSlug ? (reportsMap[compSlug] as never) : null,
          rubroRows,
        };
      }),
    [config.pairs, config.competitorSlugs, brands, reports]
  );

  return (
    <div className="pb-10 max-w-3xl">
      <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">Rivales</p>
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">Qué hace la competencia</h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
        Share de atención estimada en streaming — no apariciones Seenka. Para la reunión del viernes y
        para el pitch.
      </p>

      <div className="mt-8 space-y-10">
        {pairShowcases.map((showcase) => (
          <AgenciaPairShowcase
            key={showcase.pair.slug}
            pair={showcase.pair}
            clientReport={showcase.clientReport}
            competitorReport={showcase.competitorReport}
            rubroRows={showcase.rubroRows}
            names={names}
          />
        ))}
      </div>

      <p className="text-[12px] text-gray-400 mt-8">
        <Link href={`${AGENCIA_BASE}/donde`} className="text-accent hover:underline">
          Dónde pautar →
        </Link>
        {" · "}
        <Link href={AGENCIA_BASE} className="text-accent hover:underline">
          Guard
        </Link>
      </p>
    </div>
  );
}
