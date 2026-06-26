"use client";

import Link from "next/link";
import AdvertiserBrowseCard from "@/components/discovery/AdvertiserBrowseCard";
import CoverageLine from "@/components/CoverageLine";
import {
  browseAdvertisers,
  loadDiscoveryDataset,
  getPlatformCoverage,
} from "@/lib/discovery";
import { partnerBrandLabel, type PartnerRecord } from "@/lib/partners";
import { useMemo } from "react";

type Props = {
  brandSlugs: string[];
  competitorSlugs: string[];
  partnerName: string;
};

export default function PartnerMarcasHome({
  brandSlugs,
  competitorSlugs,
  partnerName,
}: Props) {
  const dataset = useMemo(() => loadDiscoveryDataset(), []);
  const coverage = useMemo(() => getPlatformCoverage(dataset), [dataset]);

  const partnerConfig: PartnerRecord = useMemo(
    () => ({
      id: "session",
      name: partnerName,
      brand_slugs: brandSlugs,
      competitor_slugs: competitorSlugs,
    }),
    [brandSlugs, competitorSlugs, partnerName]
  );

  const allItems = useMemo(
    () =>
      browseAdvertisers(dataset, {
        tiers: ["high_confidence", "emerging_confidence", "detected"],
        sort: "peak_conc_at",
      }),
    [dataset]
  );

  const clientBrands = useMemo(
    () => allItems.filter((i) => brandSlugs.includes(i.slug)),
    [allItems, brandSlugs]
  );

  const competitors = useMemo(
    () => allItems.filter((i) => competitorSlugs.includes(i.slug)),
    [allItems, competitorSlugs]
  );

  const missing = useMemo(() => {
    const found = new Set([...clientBrands, ...competitors].map((a) => a.slug));
    return [...brandSlugs, ...competitorSlugs].filter((s) => !found.has(s));
  }, [brandSlugs, competitorSlugs, clientBrands, competitors]);

  return (
    <div className="max-w-6xl pb-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Tus marcas monitoreadas
        </h1>
        <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Perfiles con pauta verificada, orgánico y evidencia al minuto. Canales y tendencias
          del ecosistema están disponibles en el menú como contexto de mercado.
        </p>
      </div>

      <CoverageLine coverage={coverage} />

      {missing.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-100 text-[13px] text-amber-900">
          Sin captura reciente en el período para:{" "}
          <strong>{missing.map((s) => s.replace(/-/g, " ")).join(", ")}</strong>. El monitoreo
          arranca cuando la marca aparezca en un programa capturado.
        </div>
      )}

      {clientBrands.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-4">
            Marcas de {partnerName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clientBrands.map((item) => (
              <AdvertiserBrowseCard key={item.slug} item={item} badge="Tu marca" />
            ))}
          </div>
        </section>
      )}

      {competitors.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-4">
            Competidores de referencia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {competitors.map((item) => (
              <AdvertiserBrowseCard key={item.slug} item={item} badge="Competidor" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 card p-5">
        <h2 className="text-[14px] font-semibold mb-2">Brief semanal</h2>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          El resumen para tu reunión del viernes llega por mail en PDF. Acá profundizás cada
          aparición: citas, concurrentes al minuto y links al segundo exacto en YouTube.
        </p>
        {clientBrands[0] && (
          <Link
            href={`/marcas/${clientBrands[0].slug}?tab=informes`}
            className="btn btn-primary mt-4 inline-flex"
          >
            Ver informes y descargar PDF
          </Link>
        )}
      </section>

      <p className="text-[11px] text-gray-400 mt-8">
        Alcance del contrato:{" "}
        {[...brandSlugs, ...competitorSlugs]
          .map((s) => `${s.replace(/-/g, " ")} (${partnerBrandLabel(partnerConfig, s)})`)
          .join(" · ")}
      </p>
    </div>
  );
}
