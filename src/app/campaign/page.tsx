"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import CampaignHeader from "@/components/CampaignHeader";
import ActivationsTable from "@/components/ActivationsTable";
import MomentModal from "@/components/MomentModal";
import { useDataset } from "@/lib/useDataset";
import { campaignReportKey, formatScopePeriod, listCampaignReports } from "@/lib/campaign";
import { printCampaignReportPDF } from "@/lib/campaignReport";
import reportsFb from "@/data/reports.json";
import channelsFb from "@/data/channels.json";
import momentsFb from "@/data/moments.json";

function CampaignPageInner() {
  const reports = useDataset<any>("reports", reportsFb);
  const channels = useDataset<any[]>("channels", channelsFb);
  const moments = useDataset<any>("moments", momentsFb);
  const searchParams = useSearchParams();
  const [openMention, setOpenMention] = useState<any | null>(null);

  const chName: Record<string, string> = useMemo(
    () => Object.fromEntries(channels.map((c: any) => [c.id, c.name])),
    [channels]
  );

  const campaigns = useMemo(() => listCampaignReports(reports as Record<string, any>), [reports]);

  const pickerOptions = useMemo(
    () =>
      campaigns.map((c) => ({
        slug: c.slug,
        name: c.scope?.desde
          ? `${c.name} (${formatScopePeriod(c.scope.desde, c.scope.hasta)})`
          : c.name,
        mentions: c.mentions,
      })),
    [campaigns]
  );

  const [slug, setSlug] = useState(pickerOptions[0]?.slug || "");

  useEffect(() => {
    const q = searchParams.get("slug") || searchParams.get("campaign");
    if (!q) return;
    const key = campaignReportKey(q);
    const match = campaigns.find((c) => c.slug === q || c.key === key);
    if (match) setSlug(match.slug);
  }, [searchParams, campaigns]);

  const reportKey = slug ? campaignReportKey(slug) : campaigns[0]?.key;
  const report: any = reportKey ? (reports as any)[reportKey] : null;

  if (!campaigns.length) {
    return (
      <div>
        <PageHeader
          title="Campaign Intelligence"
          sub="Investigación de campaña · expediente scoped al flight"
        />
        <div className="card p-8 text-[14px] text-gray-600 max-w-xl">
          No hay campañas publicadas. Corré{" "}
          <code className="text-[13px] bg-gray-100 px-1 rounded">campaign_report.py</code> y{" "}
          <code className="text-[13px] bg-gray-100 px-1 rounded">export_ui.py --campaign-only</code>.
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <PageHeader title="Campaign Intelligence" sub="Campaña no encontrada" />
        <div className="card p-8 text-[14px] text-gray-600">Slug: {slug || "—"}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Campaign Intelligence"
        sub="Investigación de campaña · expediente scoped al flight"
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <BrandPicker
          options={pickerOptions}
          value={slug}
          onChange={setSlug}
          placeholder="Elegí una campaña"
          searchPlaceholder="Buscar campaña…"
        />
        <span className="text-[12px] text-gray-400">{campaigns.length} campaña(s) publicada(s)</span>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => printCampaignReportPDF(report, chName)}
        >
          ↓ Descargar informe PDF
        </button>
      </div>

      <CampaignHeader report={report} chName={chName} />

      <ActivationsTable
        variant="campaign"
        rows={report.detail || []}
        chName={chName}
        onRowClick={setOpenMention}
        title="Inventario de activaciones"
        subtitle="click en una fila → Momento de Atención"
      />

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Solo activaciones del flight definido en config. El link “ver” abre el VOD en el segundo exacto.
        La evidencia describe respaldo disponible en el programa y atención medida — no cumplimiento contractual.
      </p>

      {openMention && (
        <MomentModal
          mention={openMention}
          moment={(moments as any)[openMention.video_id] || null}
          brandName={report.scope?.marca || report.name}
          onClose={() => setOpenMention(null)}
        />
      )}
    </div>
  );
}

export default function CampaignPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400 p-4">Cargando campaña…</div>}>
      <CampaignPageInner />
    </Suspense>
  );
}
