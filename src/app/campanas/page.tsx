"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandPicker from "@/components/BrandPicker";
import CampaignHeader from "@/components/CampaignHeader";
import ActivationsTable from "@/components/ActivationsTable";
import MomentModal from "@/components/MomentModal";
import { useCorpus } from "@/lib/useCorpus";
import {
  campaignReportKey,
  findAdvertiserSlugForCampaign,
  formatScopePeriod,
  listCampaignReports,
} from "@/lib/campaign";
import { printCampaignReportPDF } from "@/lib/campaignReport";

function CampanasPageInner() {
  const { reports, channels, moments, brands: brandsData } = useCorpus([
    "reports",
    "channels",
    "moments",
    "brands",
  ] as const);
  const searchParams = useSearchParams();
  const [openMention, setOpenMention] = useState<any | null>(null);

  const chName: Record<string, string> = useMemo(
    () => Object.fromEntries((channels as any[]).map((c: any) => [c.id, c.name])),
    [channels]
  );

  const brands = useMemo(
    () => brandsData as { slug: string; name: string }[],
    [brandsData]
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

  const advertiserSlug = useMemo(() => {
    if (!slug) return null;
    return findAdvertiserSlugForCampaign(slug, reports as Record<string, any>, brands);
  }, [slug, reports, brands]);

  const brandName = report?.scope?.marca || report?.name || "Marca";

  if (!campaigns.length) {
    return (
      <div className="max-w-xl">
        <nav className="text-[13px] text-gray-500 mb-5">
          <Link href="/marcas" className="hover:text-accent">
            Marcas
          </Link>
        </nav>
        <h1 className="text-[28px] font-semibold tracking-tight">Informe de entrega</h1>
        <p className="text-[15px] text-gray-600 mt-3 leading-relaxed">
          Comprobá que la pauta se cumplió — con cita, minuto y concurrentes cuando hay captura.
        </p>
        <div className="card p-8 text-[14px] text-gray-600 mt-6">
          No hay informes publicados todavía. Investigá una marca en{" "}
          <Link href="/marcas" className="text-accent font-medium hover:underline">
            Marcas
          </Link>{" "}
          y armá tu primer informe desde su perfil.
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl">
        <nav className="text-[13px] text-gray-500 mb-5">
          <Link href="/marcas" className="hover:text-accent">
            Marcas
          </Link>
        </nav>
        <h1 className="text-[28px] font-semibold tracking-tight">Informe de entrega</h1>
        <div className="card p-8 text-[14px] text-gray-600 mt-6">
          No encontramos ese informe en el período publicado.
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="text-[13px] text-gray-500 mb-5 flex flex-wrap items-center gap-1.5">
        <Link href="/marcas" className="hover:text-accent">
          Marcas
        </Link>
        <span className="text-gray-300">/</span>
        {advertiserSlug ? (
          <>
            <Link href={`/marcas/${advertiserSlug}`} className="hover:text-accent">
              {brandName}
            </Link>
            <span className="text-gray-300">/</span>
          </>
        ) : (
          <>
            <span className="text-gray-700">{brandName}</span>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="text-gray-700">Informe de entrega</span>
      </nav>

      <CampaignHeader report={report} chName={chName} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {campaigns.length > 1 ? (
          <BrandPicker
            options={pickerOptions}
            value={slug}
            onChange={setSlug}
            placeholder="Elegir otro informe"
            searchPlaceholder="Buscar marca…"
          />
        ) : null}
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
        segundo exacto. El respaldo describe prueba en el programa y atención medida — no cumplimiento
        contractual.
      </p>

      {advertiserSlug ? (
        <p className="text-[12.5px] text-gray-500 mt-6">
          <Link href={`/marcas/${advertiserSlug}`} className="text-accent font-medium hover:underline">
            ← Volver al perfil de {brandName}
          </Link>
        </p>
      ) : null}

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
