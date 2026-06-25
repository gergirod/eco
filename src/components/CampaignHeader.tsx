"use client";

import { compact, fmtHMS, vodLink } from "@/lib/format";
import {
  EVIDENCE_COLOR,
  EVIDENCE_LABEL,
  EVIDENCE_ORDER,
  EvidenceLevel,
  buildCampaignVerdict,
  evidenceLabel,
  evidenceTone,
  formatScopePeriod,
} from "@/lib/campaign";
import { Badge } from "@/components/ui";

function EvidenceSummaryBar({
  byEvidence,
  total,
}: {
  byEvidence: Record<string, number>;
  total: number;
}) {
  if (!total) {
    return <div className="text-[12px] text-gray-400">Sin apariciones en el período.</div>;
  }

  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
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
          if (!count) return null;
          return (
            <div key={level} className="flex items-center gap-2 text-[12.5px] text-gray-600">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: EVIDENCE_COLOR[level] }}
              />
              <span>{EVIDENCE_LABEL[level as EvidenceLevel]}</span>
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
  const verdict = buildCampaignVerdict(report);
  const best = report.best;

  return (
    <section
      className="card p-6 sm:p-8 mb-6 border border-[#dce8e4]"
      style={{ background: "linear-gradient(165deg, #f0faf7 0%, #ffffff 55%)" }}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#0f7d6b] font-semibold mb-3">
        Informe de entrega
      </div>

      <p className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-[#15212b] leading-snug max-w-3xl">
        {verdict}
      </p>

      <p className="text-[13.5px] text-gray-500 mt-3">
        {period}
        {channelNames ? ` · ${channelNames}` : ""}
      </p>

      {best?.quote ? (
        <div className="mt-6 pt-6 border-t border-[#e4ece9]">
          <p className="text-[11px] uppercase tracking-wider text-[#0f7d6b] font-medium mb-3">
            Mejor momento de la campaña
          </p>
          <blockquote className="text-[16px] sm:text-[18px] font-medium text-ink leading-snug mb-4">
            &ldquo;{best.quote}&rdquo;
          </blockquote>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-gray-600">
            {best.title && <span>{best.title}</span>}
            {best.date && <span>{best.date}</span>}
            {best.channel && (
              <span>{chName[best.channel] || best.channel_name || best.channel}</span>
            )}
            {best.conc_at ? (
              <span className="font-semibold text-ink">{compact(best.conc_at)} mirando</span>
            ) : null}
            {best.evidence && (
              <Badge tone={evidenceTone(best.evidence)}>{evidenceLabel(best.evidence)}</Badge>
            )}
          </div>
          {best.video_id ? (
            <a
              href={vodLink(best.video_id, best.t_seconds || 0)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[13px] text-accent font-medium hover:underline"
            >
              Ver el momento · minuto {fmtHMS(best.t_seconds || 0)}
            </a>
          ) : null}
        </div>
      ) : null}

      {total > 0 && (
        <div className="mt-6 pt-5 border-t border-[#e4ece9]">
          <EvidenceSummaryBar byEvidence={byEvidence} total={total} />
        </div>
      )}

      <p className="text-[11.5px] text-gray-400 mt-5 leading-relaxed">
        ECO describe respaldo disponible — no afirma cumplimiento contractual.
      </p>
    </section>
  );
}
