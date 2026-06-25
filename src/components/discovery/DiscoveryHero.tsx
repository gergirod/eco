"use client";

import { useMemo, useState } from "react";
import { Stat } from "@/components/ui";
import {
  getPlatformCoverage,
  loadDiscoveryDataset,
  type DiscoveryDataset,
  type DiscoveryPlatformCoverage,
} from "@/lib/discovery";

type DiscoveryHeroProps = {
  /** Optional injected dataset (tests / remote bundle in later WPs). */
  dataset?: DiscoveryDataset;
};

function formatCaptureDate(iso: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

function formatCount(n: number): string {
  return (n ?? 0).toLocaleString("es-AR");
}

function EvidenceCriteriaPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-criteria-title"
      onClick={onClose}
    >
      <div
        className="card max-w-lg w-full p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="evidence-criteria-title" className="text-[17px] font-semibold tracking-tight">
          ¿Qué significa evidencia sólida?
        </h2>
        <div className="mt-4 space-y-3 text-[13.5px] text-gray-600 leading-relaxed">
          <p>
            <strong className="text-gray-800">Alta confianza</strong> indica que el anunciante
            acumula varias activaciones de pauta con respaldo verificable en el corpus capturado —
            no que ECO validó a la empresa como entidad comercial.
          </p>
          <p>
            <strong className="text-gray-800">Evidencia completa</strong> en una activación
            significa cita en el transcript, minuto preciso y audiencia concurrente al instante
            cuando hubo captura en vivo.
          </p>
          <p className="text-[12.5px] text-gray-400">
            Proyección del corpus capturado · sin análisis nuevo.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroContent({ coverage }: { coverage: DiscoveryPlatformCoverage }) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const heroCount = coverage.highConfidenceAdvertisers;
  const heroLabel =
    heroCount === 1
      ? "anunciante de alta confianza"
      : "anunciantes de alta confianza";

  return (
    <section className="mb-2" aria-labelledby="discovery-hero-title">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Discovery</p>
        <h1
          id="discovery-hero-title"
          className="text-[22px] font-semibold tracking-tight text-ink"
        >
          Actividad comercial verificada en streaming
        </h1>
        <p className="text-[13.5px] text-gray-500 mt-1 max-w-2xl">
          Oportunidades comerciales en el ecosistema que ECO ya capturó — con evidencia
          defendible antes de auditar una campaña.
        </p>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="px-6 py-7 sm:px-8 sm:py-8 bg-gradient-to-br from-accent-soft/80 via-white to-white border-b border-[#ececec]">
          <p className="text-[11px] uppercase tracking-wider text-accent font-medium mb-3">
            Actividad comercial
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[42px] sm:text-[48px] font-semibold tracking-tight text-ink tabular-nums leading-none">
                {formatCount(heroCount)}
              </p>
              <p className="text-[18px] sm:text-[20px] font-medium text-gray-800 mt-1">
                {heroLabel}
              </p>
              <p className="text-[13px] text-gray-500 mt-2 max-w-md">
                en el ecosistema capturado ·{" "}
                <span className="text-gray-700 font-medium">
                  {formatCount(coverage.activationsWithVerifiedEvidence)} activaciones con
                  evidencia completa
                </span>
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                className="btn btn-primary"
                disabled
                title="La lista de anunciantes se habilita en el siguiente paso del sprint"
              >
                Explorar anunciantes
              </button>
              <p className="text-[11px] text-gray-400 mt-2 text-right sm:text-right">
                Lista curada · próximo paso
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 sm:px-8 bg-white">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">
            Cobertura de plataforma
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat
              label="Canales cubiertos"
              value={formatCount(coverage.channelsCovered)}
              info="Canales del ecosistema con al menos una emisión registrada en el corpus."
            />
            <Stat
              label="Horas capturadas"
              value={formatHours(coverage.hoursCaptured)}
              info="Horas de emisión transcritas y registradas — profundidad del corpus."
            />
            <Stat
              label="Última captura"
              value={formatCaptureDate(coverage.lastCapture)}
              info="Fecha de la emisión más reciente ingerida."
            />
            <Stat
              label="Programas con audiencia"
              value={formatCount(coverage.programsWithViewers)}
              hint="concurrentes al minuto"
              info="Emisiones con serie de espectadores — donde la atención es medible."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-gray-400">
          Proyección del corpus · sin análisis nuevo
        </p>
        <button
          type="button"
          className="text-[13px] text-accent font-medium hover:underline"
          onClick={() => setCriteriaOpen(true)}
        >
          ¿Qué significa evidencia sólida?
        </button>
      </div>

      {criteriaOpen && <EvidenceCriteriaPanel onClose={() => setCriteriaOpen(false)} />}
    </section>
  );
}

export default function DiscoveryHero({ dataset }: DiscoveryHeroProps) {
  const coverage = useMemo(() => {
    const ds = dataset ?? loadDiscoveryDataset();
    return getPlatformCoverage(ds);
  }, [dataset]);

  return <HeroContent coverage={coverage} />;
}
