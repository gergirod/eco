"use client";

import Link from "next/link";
import { buildCampaignVerdict, formatScopePeriod } from "@/lib/campaign";
import { printCampaignReportPDF } from "@/lib/campaignReport";

type CampaignReport = {
  name?: string;
  scope?: { marca?: string; desde?: string; hasta?: string };
  mentions?: number;
  detail?: unknown[];
  summary?: { by_evidence?: Record<string, number> };
};

type Props = {
  campaignSlug: string;
  campaignReport: CampaignReport;
  chName: Record<string, string>;
};

export default function CampaignDeliveryBanner({
  campaignSlug,
  campaignReport,
  chName,
}: Props) {
  const marca = campaignReport.scope?.marca || campaignReport.name || "Tu marca";
  const period =
    campaignReport.scope?.desde && campaignReport.scope?.hasta
      ? formatScopePeriod(campaignReport.scope.desde, campaignReport.scope.hasta)
      : null;

  return (
    <div className="card p-5 mb-6 border-accent/20 bg-gradient-to-br from-accent-soft/40 to-white">
      <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1">
        Informe de entrega publicado
      </div>
      <h2 className="text-[17px] font-semibold text-ink mb-1">{marca}</h2>
      {period ? (
        <p className="text-[13px] text-gray-500 mb-2">Período de pauta: {period}</p>
      ) : null}
      <p className="text-[13.5px] text-gray-700 leading-relaxed mb-4 max-w-2xl">
        {buildCampaignVerdict(campaignReport)}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href={`/campanas?slug=${campaignSlug}`} className="btn btn-primary">
          Ver informe completo
        </Link>
        <button
          type="button"
          className="btn border border-[#ececec]"
          onClick={() => printCampaignReportPDF(campaignReport, chName)}
        >
          ↓ Descargar PDF
        </button>
      </div>
    </div>
  );
}
