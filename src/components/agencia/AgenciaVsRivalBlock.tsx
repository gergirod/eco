"use client";

import { useMemo } from "react";
import AgenciaPairShowcase from "@/components/agencia/AgenciaPairShowcase";
import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { buildRubroShare, markCompetitorsInRubro } from "@/lib/agencia-product";
import { useCorpus } from "@/lib/useCorpus";

type Props = {
  pair: AgenciaBrandPair;
  brandName: string;
};

/** Compare vs rival — colapsado, no pantalla aparte. */
export default function AgenciaVsRivalBlock({ pair, brandName }: Props) {
  const { brands, reports } = useCorpus(["brands", "reports"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const compSlug = pair.competitorSlug;
  if (!compSlug) return null;

  const reportsMap = reports as Record<string, never>;
  const rubroRows = useMemo(
    () =>
      markCompetitorsInRubro(
        buildRubroShare(pair.rubro, brands as never[], reportsMap, [pair.slug, compSlug]),
        [compSlug]
      ),
    [pair, brands, reports]
  );

  const rivalName = names[compSlug] ?? compSlug;

  return (
    <details className="group rounded-xl border border-[#ececec] bg-gray-50/80">
      <summary className="cursor-pointer list-none px-4 py-3.5 text-[14px] text-gray-700 hover:text-ink flex items-center gap-2">
        <span className="group-open:rotate-90 transition text-gray-400">▸</span>
        ¿Cómo venimos vs {rivalName}?
      </summary>
      <div className="px-4 pb-5 pt-1 border-t border-gray-100">
        <p className="text-[12px] text-gray-500 mb-4">
          Placas y share de {brandName} frente a {rivalName} — solo si te lo piden en la reunión.
        </p>
        <AgenciaPairShowcase
          pair={pair}
          clientReport={reportsMap[pair.slug] as never}
          competitorReport={reportsMap[compSlug] as never}
          rubroRows={rubroRows}
          names={names}
        />
      </div>
    </details>
  );
}
