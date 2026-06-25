"use client";

import { useState } from "react";

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
            acumula varias activaciones de pauta con respaldo verificable en los programas que
            observamos — no que validamos a la empresa como entidad comercial.
          </p>
          <p>
            <strong className="text-gray-800">Evidencia completa</strong> en una activación
            significa cita en el programa, minuto preciso y cuánta gente miraba en ese instante
            cuando hubo captura en vivo.
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

type DiscoveryHeroProps = {
  /** Comma-separated brand names for the subline, e.g. "IOL, Rexona y Skip". */
  brandTeaser?: string;
};

export default function DiscoveryHero({ brandTeaser }: DiscoveryHeroProps) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  return (
    <section className="mb-6" aria-labelledby="discovery-hero-title">
      <h1
        id="discovery-hero-title"
        className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-ink leading-[1.15] max-w-3xl"
      >
        Pauta verificable en el streaming argentino — lista para investigar.
      </h1>

      <p className="mt-3 text-[15px] sm:text-[16px] text-gray-600 max-w-2xl leading-relaxed">
        {brandTeaser ? (
          <>
            Marcas como <strong className="text-ink font-medium">{brandTeaser}</strong> ya tienen
            activaciones con prueba en Olga, Luzu y el ecosistema que observamos.
          </>
        ) : (
          <>
            Anunciantes con activaciones defendibles en los programas que observamos — con cita,
            minuto y audiencia al instante.
          </>
        )}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <a href="#todos-los-anunciantes" className="btn btn-primary">
          Ver todos los anunciantes
        </a>
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
