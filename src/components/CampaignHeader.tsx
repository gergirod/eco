"use client";

import { Stat } from "@/components/ui";
import { num } from "@/lib/format";
import {
  EVIDENCE_COLOR,
  EVIDENCE_LABEL,
  EVIDENCE_ORDER,
  EvidenceLevel,
  formatScopePeriod,
} from "@/lib/campaign";

function EvidenceSummaryBar({
  byEvidence,
  total,
}: {
  byEvidence: Record<string, number>;
  total: number;
}) {
  if (!total) {
    return <div className="text-[12px] text-gray-400">Sin activaciones en el flight.</div>;
  }

  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100">
        {EVIDENCE_ORDER.map((level) => {
          const count = byEvidence[level] || 0;
          if (!count) return null;
          return (
            <div
              key={level}
              style={{ width: `${(count / total) * 100}%`, background: EVIDENCE_COLOR[level] }}
              title={`${EVIDENCE_LABEL[level]}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {EVIDENCE_ORDER.map((level) => {
          const count = byEvidence[level] || 0;
          return (
            <div key={level} className="flex items-center gap-2 text-[13px] text-gray-700">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: EVIDENCE_COLOR[level] }}
              />
              <span className="font-medium">{EVIDENCE_LABEL[level as EvidenceLevel]}</span>
              <span className="tabular-nums text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CampaignHeader({
  report,
  chName,
}: {
  report: any;
  chName: Record<string, string>;
}) {
  const scope = report.scope || {};
  const total = report.mentions ?? report.detail?.length ?? 0;
  const byEvidence = report.summary?.by_evidence || {};
  const channelNames = (scope.canales || report.channels || [])
    .map((id: string) => chName[id] || id)
    .join(" · ");
  const period = formatScopePeriod(scope.desde, scope.hasta);
  const verified = byEvidence.VERIFIED || 0;

  return (
    <section
      className="card p-6 mb-6 border border-[#dce8e4]"
      style={{ background: "linear-gradient(165deg, #f0faf7 0%, #ffffff 55%)" }}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#0f7d6b] font-semibold mb-2">
        Campaign Intelligence · Investigación de campaña
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight text-[#15212b] leading-tight">
        {scope.marca || report.name}
      </h1>
      <p className="text-[14px] text-gray-600 mt-2 max-w-[720px]">
        Expediente del flight contratado: qué PNT se detectó, con qué respaldo en transcript,
        timestamp y audiencia concurrente. ECO no afirma cumplimiento contractual.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Stat label="Período analizado" value={period} hint="fechas del flight" />
        <Stat
          label="Canales incluidos"
          value={scope.canales?.length || report.channels?.length || 0}
          hint={channelNames || "—"}
        />
        <Stat
          label="Activaciones detectadas"
          value={num(total)}
          hint="PNT verificadas en el flight"
        />
        <Stat
          label="Con evidencia completa"
          value={num(verified)}
          hint={
            total
              ? `${Math.round((100 * verified) / total)}% del inventario`
              : "—"
          }
        />
      </div>

      <div className="mt-6 pt-5 border-t border-[#e4ece9]">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-3">
          Resumen de evidencia
        </div>
        <EvidenceSummaryBar byEvidence={byEvidence} total={total} />
      </div>
    </section>
  );
}
