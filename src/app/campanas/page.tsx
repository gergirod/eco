"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function CampanasPageInner() {
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
      <div className="max-w-xl">
        <h1 className="text-[28px] font-semibold tracking-tight">Campañas</h1>
        <p className="text-[15px] text-gray-600 mt-3 leading-relaxed">
          Comprobar que la pauta se cumplió — informe de entrega con respaldo.
        </p>
        <div className="card p-8 text-[14px] text-gray-600 mt-6">
          No hay campañas publicadas todavía. Investigá una marca en{" "}
          <Link href="/marcas" className="text-accent font-medium hover:underline">
            Marcas
          </Link>{" "}
          para armar tu primer informe de entrega.
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl">
        <h1 className="text-[28px] font-semibold tracking-tight">Campañas</h1>
        <div className="card p-8 text-[14px] text-gray-600 mt-6">
          No encontramos esa campaña en el período publicado.
        </div>
      </div>
    );
  }

  return (
    <div>
      <CampaignHeader report={report} chName={chName} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <BrandPicker
          options={pickerOptions}
          value={slug}
          onChange={setSlug}
          placeholder="Elegir otra campaña"
          searchPlaceholder="Buscar campaña…"
        />
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => printCampaignReportPDF(report, chName)}
        >
          ↓ Descargar informe de entrega
        </button>
      </div>

      <ActivationsTable
        variant="campaign"
        rows={report.detail || []}
        chName={chName}
        onRowClick={setOpenMention}
        title="Inventario de apariciones"
      />

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Solo apariciones del período de pauta acordado. &ldquo;Ir al minuto&rdquo; abre el vivo en el
        segundo exacto. El respaldo describe prueba en transcript y audiencia — no cumplimiento
        contractual.
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

export default function CampanasPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400 p-4">Cargando…</div>}>
      <CampanasPageInner />
    </Suspense>
  );
}
