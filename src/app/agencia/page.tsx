"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaAlertCard from "@/components/agencia/AgenciaAlertCard";
import AgenciaFeaturedMoment from "@/components/agencia/AgenciaFeaturedMoment";
import AgenciaGuardStatus from "@/components/agencia/AgenciaGuardStatus";
import AgenciaProductHero from "@/components/agencia/AgenciaProductHero";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { brandDisplayName } from "@/lib/agencia-roles";
import { buildGuardStatus } from "@/lib/agencia-guard";
import { buildBrandSlots } from "@/lib/agencia-donde";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { buildAgenciaAlerts } from "@/lib/agencia-product";
import { compact, vodLink } from "@/lib/format";
import { useCorpus } from "@/lib/useCorpus";

export default function AgenciaGuardPage() {
  const { config, loading } = useAgenciaConfig();
  const { brands, reports, meta } = useCorpus(["brands", "reports", "meta"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const reportsMap = reports as Record<string, never>;

  const guardStatus = useMemo(
    () =>
      buildGuardStatus(
        config.pairs,
        config.brandSlugs,
        config.competitorSlugs,
        reportsMap,
        (meta as { exported_at?: string }).exported_at
      ),
    [config, reports, meta]
  );

  const alerts = useMemo(
    () => buildAgenciaAlerts(config.pairs, reportsMap),
    [config.pairs, reports]
  );

  const valleyWarnings = useMemo(
    () =>
      config.brandSlugs.flatMap((slug) =>
        buildBrandSlots(slug, reportsMap[slug] as never, "cliente").filter((s) => s.isValley)
      ),
    [config.brandSlugs, reports]
  );

  const wanderlustBest = (reportsMap["wanderlust"] as { best?: never })?.best;
  const wanderlustComp = config.pairs.find((p) => p.slug === "wanderlust")?.competitorSlug;

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  return (
    <div className="pb-10">
      <AgenciaProductHero isPreview={config.isPreview} agencyName={config.name} />

      <section className="mt-6">
        <AgenciaGuardStatus status={guardStatus} />
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="text-[12px] uppercase tracking-wide text-gray-400 font-medium">
              Alertas · cuando sale tu PNT
            </h2>
            <p className="text-[13px] text-gray-500 mt-1">
              Push por WhatsApp con concurrentes al segundo. Esto es ECO Guard.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AgenciaAlertCard
              key={alert.id}
              alert={alert}
              role={config.brandSlugs.includes(alert.brandSlug) ? "cliente" : "competidor"}
            />
          ))}
        </div>
      </section>

      {valleyWarnings.length > 0 && (
        <section className="mt-8 card p-5 border-amber-200 bg-amber-50/50">
          <h2 className="text-[13px] font-semibold text-amber-900 mb-2">
            ⚠️ No repetir estos slots
          </h2>
          <p className="text-[13px] text-amber-900/80 mb-3">
            Salieron en valle (&lt;40% del pico del programa) — no gastar de nuevo acá sin negociar
            otro formato.
          </p>
          <ul className="space-y-2 text-[13px] text-amber-950">
            {valleyWarnings.map((s, i) => (
              <li key={`${s.videoId}-${i}`}>
                <strong>{s.brandName}</strong> · {s.channelName} · {compact(s.concAt)} mirando (
                {s.peakPct}% pico)
                {s.videoId && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={vodLink(s.videoId, s.tSeconds)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      evidencia
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {wanderlustBest && config.isPreview && (
        <section className="mt-12">
          <h2 className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-3">
            Evidencia · ejemplo Wanderlust
          </h2>
          <AgenciaFeaturedMoment
            brandName="Wanderlust"
            brandSlug="wanderlust"
            competitorName={
              wanderlustComp ? brandDisplayName(wanderlustComp, names) : undefined
            }
            competitorSlug={wanderlustComp ?? undefined}
            best={wanderlustBest}
          />
        </section>
      )}

      <section className="mt-10 flex flex-wrap gap-3">
        <Link href={`${AGENCIA_BASE}/donde`} className="btn btn-primary text-[13px]">
          Dónde pautar la próxima
        </Link>
        <Link href={`${AGENCIA_BASE}/pulso`} className="btn border border-[#ececec] text-[13px]">
          Rivales
        </Link>
      </section>
    </div>
  );
}
