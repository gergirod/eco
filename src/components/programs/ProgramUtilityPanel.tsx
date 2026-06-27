"use client";

import { useState } from "react";
import { Badge, Bar } from "@/components/ui";
import InfoTip from "@/components/InfoTip";
import {
  IUP_METHODOLOGY,
  IUP_WEIGHTS,
  componentDetailText,
  tierLabel,
  tierTone,
  type ProgramUtilityRow,
} from "@/lib/programUtility";

type Props = {
  row: ProgramUtilityRow;
  /** En perfil de emisión: metodología colapsada por defecto. En backoffice: expandida. */
  defaultExpanded?: boolean;
};

export default function ProgramUtilityPanel({ row, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h2 className="text-[15px] font-semibold">Utilidad de esta emisión</h2>
        <InfoTip
          label="Qué es el IUP"
          text="Score 0–100 por emisión en vivo (no por show). Una emisión = un video_id capturado. Soñé Que Volaba es el programa; cada martes que lo trackeamos es una emisión con su propio IUP."
        />
      </div>
      <p className="text-[13px] text-gray-500 mb-2 max-w-2xl leading-relaxed">
        {IUP_METHODOLOGY.intro}
      </p>
      <p className="text-[12.5px] text-gray-400 mb-4 max-w-2xl leading-relaxed border-l-2 border-gray-200 pl-3">
        {IUP_METHODOLOGY.vocabulary}
      </p>

      <div className="card p-5 max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">IUP · esta emisión</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold tabular-nums text-ink">{row.iup}</span>
              <span className="text-[13px] text-gray-400">/ 100</span>
            </div>
          </div>
          <Badge tone={tierTone(row.tier)}>{tierLabel(row.tier)}</Badge>
        </div>

        <div className="flex flex-col gap-3.5">
          {IUP_WEIGHTS.map(({ id, label, pct }) => {
            const raw = row.components[id];
            const contrib = Math.round(raw * pct);
            return (
              <div key={id}>
                <div className="flex justify-between text-[12.5px] mb-1 gap-2">
                  <span className="text-gray-700">
                    {label}{" "}
                    <span className="text-gray-400">({pct}%)</span>
                  </span>
                  <span className="text-gray-400 tabular-nums shrink-0">
                    +{contrib} pts · {Math.round(raw * 100)}%
                  </span>
                </div>
                <Bar value={raw * 100} max={100} tone="#2f5fe0" />
                <p className="text-[11.5px] text-gray-400 mt-1">{componentDetailText(row, id)}</p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-5 text-[13px] text-accent font-medium hover:underline"
        >
          {expanded ? "Ocultar metodología" : "¿Cómo se calcula?"}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[#ececec] text-[13px] text-gray-600 space-y-4 leading-relaxed">
            <p>{IUP_METHODOLOGY.formula}</p>
            <ul className="space-y-3">
              {IUP_METHODOLOGY.components.map((c) => (
                <li key={c.id}>
                  <b className="text-gray-800">{c.label}</b>
                  <span className="text-gray-400"> — fuente: </span>
                  <code className="text-[12px] bg-gray-50 px-1 rounded">{c.source}</code>
                  <p className="mt-0.5 text-gray-600">{c.how}</p>
                </li>
              ))}
            </ul>
            <div>
              <p className="font-medium text-gray-800 mb-2">Niveles</p>
              <ul className="space-y-1">
                {IUP_METHODOLOGY.tiers.map((t) => (
                  <li key={t.id}>
                    <Badge tone={tierTone(t.id)}>{t.range}</Badge>{" "}
                    <span className="text-gray-600">{t.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[12px] text-gray-400">
              Calculado en <code className="bg-gray-50 px-1 rounded">pipeline/program_utility.py</code>{" "}
              al exportar la UI. Distinto del engagement_index (solo participación en SPEC-011).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
