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
          ¿Qué significa actividad sólida?
        </h2>
        <div className="mt-4 space-y-3 text-[13.5px] text-gray-600 leading-relaxed">
          <p>
            <strong className="text-gray-800">Actividad sólida</strong> indica que la marca acumula
            varias apariciones de pauta con respaldo verificable en los programas que observamos —
            no que validamos a la empresa como entidad comercial.
          </p>
          <p>
            <strong className="text-gray-800">Respaldo completo</strong> en una aparición significa
            cita en el programa, minuto preciso y cuánta gente miraba en ese instante cuando hubo
            captura en vivo.
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
  /** Hallazgo del período en una frase. */
  headline: string;
};

export default function DiscoveryHero({ headline }: DiscoveryHeroProps) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  return (
    <section className="mb-4" aria-labelledby="discovery-hero-title">
      <h1
        id="discovery-hero-title"
        className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-ink leading-[1.15] max-w-3xl"
      >
        {headline}
      </h1>

      <div className="mt-4">
        <button
          type="button"
          className="text-[13px] text-accent font-medium hover:underline"
          onClick={() => setCriteriaOpen(true)}
        >
          ¿Qué significa actividad sólida?
        </button>
      </div>

      {criteriaOpen && <EvidenceCriteriaPanel onClose={() => setCriteriaOpen(false)} />}
    </section>
  );
}
