"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaPageHeader from "@/components/agencia/AgenciaPageHeader";
import AgenciaPairShowcase from "@/components/agencia/AgenciaPairShowcase";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { useActiveBrand } from "@/lib/use-active-brand";
import { buildRubroShare, markCompetitorsInRubro } from "@/lib/agencia-product";
import { useCorpus } from "@/lib/useCorpus";

export default function AgenciaRivalesPage() {
  const { activePair, activeSlug, loading, hasRival } = useActiveBrand();
  const { brands, reports } = useCorpus(["brands", "reports"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const brandName = names[activeSlug ?? ""] ?? activeSlug ?? "tu cliente";

  const reportsMap = reports as Record<string, never>;

  const showcase = useMemo(() => {
    if (!activePair?.competitorSlug) return null;
    const compSlug = activePair.competitorSlug;
    const rubroRows = markCompetitorsInRubro(
      buildRubroShare(activePair.rubro, brands as never[], reportsMap, [
        activePair.slug,
        compSlug,
      ]),
      [compSlug]
    );
    return {
      pair: activePair,
      clientReport: reportsMap[activePair.slug] as never,
      competitorReport: reportsMap[compSlug] as never,
      rubroRows,
    };
  }, [activePair, brands, reports]);

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  if (!activePair) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <p className="text-[14px] text-gray-600 mb-4">Elegí una marca primero.</p>
        <Link href={`${AGENCIA_BASE}/elegir`} className="btn btn-primary text-[13px]">
          Elegir marca →
        </Link>
      </div>
    );
  }

  if (!hasRival) {
    return (
      <div className="pb-12 max-w-2xl">
        <AgenciaPageHeader
          question="¿Quién ganó más miradas?"
          when="Comparación cliente vs rival — solo si configuraste uno."
        />
        <div className="rounded-xl border border-[#ececec] bg-gray-50 px-5 py-5 text-[14px] text-gray-700 leading-relaxed">
          <p>
            Para {brandName} no hay rival cargado. Podés seguir con placas y mercado sin comparar
            share.
          </p>
          <p className="mt-3">
            Si querés la pelea de miradas,{" "}
            <Link href={`${AGENCIA_BASE}/elegir`} className="text-accent font-medium hover:underline">
              elegí un rival
            </Link>{" "}
            (opcional).
          </p>
        </div>
        <footer className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-[13px]">
          <Link href={`${AGENCIA_BASE}/donde`} className="text-accent hover:underline">
            ← ¿Dónde pautar?
          </Link>
          <Link href={AGENCIA_BASE} className="text-accent hover:underline">
            ¿Rindió la placa?
          </Link>
        </footer>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-2xl">
      <AgenciaPageHeader
        question="¿Quién ganó más miradas?"
        when={`${brandName} vs el rival — share del rubro esta semana.`}
      />

      {showcase && (
        <AgenciaPairShowcase
          pair={showcase.pair}
          clientReport={showcase.clientReport}
          competitorReport={showcase.competitorReport}
          rubroRows={showcase.rubroRows}
          names={names}
        />
      )}

      <footer className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-[13px]">
        <Link href={`${AGENCIA_BASE}/donde`} className="text-accent hover:underline">
          ← ¿Dónde pautar?
        </Link>
        <Link href={AGENCIA_BASE} className="text-accent hover:underline">
          ¿Rindió la placa?
        </Link>
      </footer>
    </div>
  );
}
