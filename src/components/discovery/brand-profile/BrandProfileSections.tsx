"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ActivationsTable from "@/components/ActivationsTable";
import ValuationNotice from "@/components/ValuationNotice";
import { Badge, Bar, Stat } from "@/components/ui";
import {
  EVIDENCE_SHORT,
  buildCampaignVerdict,
  evidenceLabel,
  evidenceTone,
  formatScopePeriod,
} from "@/lib/campaign";
import type { DiscoveryAdvertiser } from "@/lib/discovery";
import { compact, fmtHMS, num, vodLink } from "@/lib/format";
import { chatTableLine, chatToneClass, chatToneDot } from "@/lib/chatReaction";
import { usdEst } from "@/lib/valuation";
import { printCampaignReportPDF } from "@/lib/campaignReport";
import { buildReportHTML } from "@/lib/report";
import { PROMINENCE_BAR } from "@/lib/prominence";
import { programsForBrand, type BrandProgramSort } from "@/lib/programs";
import ProgramListCard from "@/components/programs/ProgramListCard";
import { VALUATION_HINT, VALUATION_INFO } from "@/lib/valuation";
import type { BrandProfileTabId } from "./tabs";

type BrandReport = {
  name: string;
  mentions?: number;
  value_usd?: number;
  channels?: string[];
  detail?: Record<string, unknown>[];
  series?: { date: string; value_usd: number; mentions: number }[];
  by_tier?: Record<string, number>;
  by_sentiment?: Record<string, number>;
  best?: {
    channel_name?: string;
    date?: string;
    conc_at?: number;
    t_seconds?: number;
    value_usd?: number;
  };
  summary?: { by_evidence?: Record<string, number> };
  scope?: { marca?: string; desde?: string; hasta?: string };
};

type SectionProps = {
  tab: BrandProfileTabId;
  slug: string;
  advertiser: DiscoveryAdvertiser;
  report: BrandReport;
  chName: Record<string, string>;
  moments: Record<string, Record<string, unknown>>;
  campaignSlug: string | null;
  campaignReport: BrandReport | null;
  onOpenMoment: (row: Record<string, unknown>) => void;
  allReports: Record<string, { name: string; detail?: Record<string, unknown>[] }>;
  /** Vista acotada a un canal (desde perfil de canal). */
  channelScope?: string;
};

function EvolutionChart({ series }: { series: BrandReport["series"] }) {
  if (!series?.length) {
    return <div className="text-[12px] text-gray-400">Sin serie temporal en el período.</div>;
  }
  const W = 720;
  const H = 150;
  const pad = 8;
  const maxV = Math.max(...series.map((s) => s.value_usd), 1);
  const n = series.length;
  const bw = (W - pad * 2) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      {series.map((s, i) => {
        const h = ((H - 28) * s.value_usd) / maxV;
        const x = pad + i * bw;
        const y = H - 20 - h;
        return (
          <g key={i}>
            <rect
              x={x + bw * 0.18}
              y={y}
              width={bw * 0.64}
              height={Math.max(1, h)}
              rx={2}
              fill="#2f5fe0"
              opacity={0.85}
            >
              <title>{`${s.date} · ${s.mentions} menciones · ${usdEst(s.value_usd)}`}</title>
            </rect>
            {n <= 16 && (
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#aaa">
                {s.date.slice(0, 5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function SegBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
        {parts.map((p, i) => (
          <div
            key={i}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.label} <span className="tabular-nums text-gray-400">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumenSection({ report, chName }: { report: BrandReport; chName: Record<string, string> }) {
  const detail = report.detail || [];
  const programs = new Set(detail.map((d) => d.video_id)).size;
  const byChannel = useMemo(() => {
    const m: Record<string, { mentions: number; value: number }> = {};
    detail.forEach((d) => {
      const ch = String(d.channel || "");
      m[ch] = m[ch] || { mentions: 0, value: 0 };
      m[ch].mentions++;
      m[ch].value += Number(d.value_usd || 0);
    });
    return Object.entries(m).sort((a, b) => b[1].mentions - a[1].mentions);
  }, [detail]);
  const topChannel = byChannel[0] ? chName[byChannel[0][0]] || byChannel[0][0] : "—";
  const best = report.best;
  const tier = report.by_tier || { "1": 0, "2": 0, "3": 0 };
  const sent = report.by_sentiment || { positivo: 0, neutro: 0, negativo: 0 };

  return (
    <div>
      <div
        className="card p-5 mb-5"
        style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}
      >
        <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1.5">
          Resumen ejecutivo
        </div>
        <p className="text-[15px] leading-relaxed text-gray-700 max-w-[820px]">
          <b>{report.name}</b> acumula <b>{num(report.mentions ?? detail.length)}</b> lecturas de
          pauta en <b>{programs}</b> programas en <b>{report.channels?.length ?? 0}</b>{" "}
          streams, con exposición total de <b>{usdEst(report.value_usd || 0)}</b> de exposición
          estimada en rango (benchmark, no facturación).{" "}
          {best && (
            <>
              El momento más fuerte: <b>{best.channel_name}</b> el {best.date}
              {best.conc_at ? (
                <>
                  {" "}
                  — <b>{compact(best.conc_at)}</b> de atención en el minuto exacto (
                  {usdEst(best.value_usd || 0)})
                </>
              ) : (
                <> ({usdEst(best.value_usd || 0)})</>
              )}
              . Mayor presencia en <b>{topChannel}</b>.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Apariciones verificadas" value={num(report.mentions ?? detail.length)} hint={`en ${programs} programas`} />
        <Stat label="Canales" value={report.channels?.length ?? 0} hint="streams con pauta" />
        <Stat
          label="Pico de atención"
          value={best?.conc_at ? compact(best.conc_at) : "—"}
          hint={best ? `marca ${fmtHMS(best.t_seconds || 0)}` : "sin concurrentes"}
        />
        <Stat
          label="Exposición estimada"
          value={usdEst(report.value_usd || 0)}
          hint={VALUATION_HINT}
          info={VALUATION_INFO}
        />
      </div>

      <div className="mb-5">
        <ValuationNotice />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Evolución temporal</h2>
          <EvolutionChart series={report.series} />
          <div className="text-[11px] text-gray-400 mt-1">
            Exposición estimada por día (benchmark, no factura).
          </div>
        </div>
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-[13px] font-semibold mb-2.5">Formato de la pauta</h3>
            <SegBar
              parts={PROMINENCE_BAR.map((p) => ({
                label: p.label,
                value: tier[p.key as "1" | "2" | "3"] || 0,
                color: p.color,
              }))}
            />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold mb-2.5">Sentimiento</h3>
            <SegBar
              parts={[
                { label: "Positivo", value: sent.positivo || 0, color: "#22a06b" },
                { label: "Neutro", value: sent.neutro || 0, color: "#cbd2dd" },
                { label: "Negativo", value: sent.negativo || 0, color: "#e2574c" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CanalesSection({
  report,
  chName,
}: {
  report: BrandReport;
  chName: Record<string, string>;
}) {
  const byChannel = useMemo(() => {
    const m: Record<string, { mentions: number; value: number }> = {};
    (report.detail || []).forEach((d) => {
      const ch = String(d.channel || "");
      m[ch] = m[ch] || { mentions: 0, value: 0 };
      m[ch].mentions++;
      m[ch].value += Number(d.value_usd || 0);
    });
    return Object.entries(m).sort((a, b) => b[1].mentions - a[1].mentions);
  }, [report.detail]);
  const maxCh = Math.max(...byChannel.map(([, v]) => v.mentions), 1);

  if (!byChannel.length) {
    return <p className="text-[14px] text-gray-500">Sin apariciones por canal en el período.</p>;
  }

  return (
    <div className="card p-5 max-w-lg">
      <h2 className="text-[15px] font-semibold mb-4">Presencia por canal</h2>
      <div className="flex flex-col gap-3.5">
        {byChannel.map(([cid, v]) => (
          <div key={cid}>
            <div className="flex justify-between text-[13px] mb-1">
              <Link href={`/canales?channel=${cid}`} className="font-medium hover:text-accent">
                {chName[cid] || cid}
              </Link>
              <span className="text-gray-400 tabular-nums">{v.mentions} apariciones</span>
            </div>
            <Bar value={v.mentions} max={maxCh} />
            <div className="text-[11px] text-gray-400 mt-0.5">{usdEst(v.value)} exposición est.</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramasSection({
  reports,
  moments,
  brandSlug,
  chName,
  channelScope,
}: {
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>;
  moments: Record<string, Record<string, unknown>>;
  brandSlug: string;
  chName: Record<string, string>;
  channelScope?: string;
}) {
  const [sort, setSort] = useState<BrandProgramSort>("peak");
  const programs = useMemo(
    () => programsForBrand(reports, moments, brandSlug, sort, channelScope),
    [reports, moments, brandSlug, sort, channelScope]
  );

  if (!programs.length) {
    return <p className="text-[14px] text-gray-500">Sin programas con apariciones en el período.</p>;
  }

  const sorts: { id: BrandProgramSort; label: string }[] = [
    { id: "peak", label: "Mayor pico de atención" },
    { id: "activations", label: "Más apariciones" },
    { id: "recency", label: "Más reciente" },
  ];

  return (
    <div>
      <p className="text-[13.5px] text-gray-600 mb-4 max-w-xl">
        Programas donde la marca tuvo pauta — ordenados para ver dónde rindió mejor la inversión.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {sorts.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] border transition ${
              sort === s.id
                ? "bg-accent-soft border-accent text-accent font-medium"
                : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {programs.map((p) => (
          <ProgramListCard
            key={p.video_id}
            program={p}
            chName={chName}
            brandSlug={brandSlug}
            showBrandChips={false}
          />
        ))}
      </div>
    </div>
  );
}

function VideosSection({
  reports,
  moments,
  brandSlug,
  chName,
  channelScope,
}: {
  reports: Record<string, { name: string; detail?: Record<string, unknown>[] }>;
  moments: Record<string, Record<string, unknown>>;
  brandSlug: string;
  chName: Record<string, string>;
  channelScope?: string;
}) {
  const programs = useMemo(
    () => programsForBrand(reports, moments, brandSlug, "peak", channelScope),
    [reports, moments, brandSlug, channelScope]
  );

  if (!programs.length) {
    return <p className="text-[14px] text-gray-500">Sin videos con apariciones en el período.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {programs.map((p) => {
        const first = p.pnt[0];
        return (
          <div key={p.video_id} className="card p-4 flex flex-col">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
              {chName[p.channel] || p.channel_name}
            </p>
            <h3 className="text-[15px] font-semibold text-ink mb-2 line-clamp-2">{p.title}</h3>
            <p className="text-[12.5px] text-gray-500 mb-4">
              {p.date} · {p.pnt_count} momentos con pauta
              {p.peak ? ` · pico programa ${compact(p.peak)}` : ""}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <a
                href={vodLink(p.video_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-[12.5px] py-2"
              >
                Ir al video
              </a>
              {first && (
                <a
                  href={vodLink(p.video_id, first.t_seconds || 0)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn text-[12.5px] py-2 border border-[#ececec]"
                >
                  Primer momento
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AudienciaSection({
  report,
  chName,
  onOpenMoment,
}: {
  report: BrandReport;
  chName: Record<string, string>;
  onOpenMoment: (row: Record<string, unknown>) => void;
}) {
  const withConc = (report.detail || []).filter((d) => d.conc_at && Number(d.conc_at) > 0);
  const sorted = [...withConc].sort((a, b) => Number(b.conc_at) - Number(a.conc_at));

  if (!sorted.length) {
    return (
      <div className="card p-6 max-w-xl">
        <p className="text-[14px] text-gray-600 leading-relaxed">
          No hay atención medida al minuto para esta marca en el período. Requiere captura
          durante la emisión en vivo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13.5px] text-gray-600 mb-5 max-w-[640px]">
        Momentos con audiencia medida al instante de la aparición. Clic en una fila para ver el
        minuto completo con gráfico de concurrentes y chat.
      </p>
      <div className="card overflow-hidden">
        <table>
          <thead className="sticky top-0 bg-white">
            <tr>
              <th>Fecha</th>
              <th>Programa</th>
              <th>Canal</th>
              <th>Minuto</th>
              <th className="text-right">Concurrentes</th>
              <th>Chat en la pauta</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={i} className="cursor-pointer" onClick={() => onOpenMoment(d)}>
                <td className="text-gray-500 whitespace-nowrap text-[12.5px]">{String(d.date)}</td>
                <td className="max-w-[200px] truncate text-[12.5px]" title={String(d.title)}>
                  {String(d.title)}
                </td>
                <td className="whitespace-nowrap text-[12.5px]">
                  {chName[String(d.channel)] || String(d.channel_name)}
                </td>
                <td className="font-mono text-[12px] text-gray-600">
                  {fmtHMS(Number(d.t_seconds) || 0)}
                </td>
                <td className="text-right tabular-nums font-semibold text-[13px]">
                  {compact(Number(d.conc_at))}
                </td>
                <td className="max-w-[180px]">
                  <div className="flex items-start gap-1.5">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${chatToneDot(d)}`} aria-hidden />
                    <span className={`text-[11.5px] leading-snug ${chatToneClass(d)}`}>
                      {chatTableLine(d)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvidenciaSection({
  advertiser,
  report,
}: {
  advertiser: DiscoveryAdvertiser;
  report: BrandReport;
}) {
  const byEvidence = report.summary?.by_evidence || {};
  const fromDetail: Record<string, number> = {};
  (report.detail || []).forEach((d) => {
    const key = String(d.evidence || "unknown");
    fromDetail[key] = (fromDetail[key] || 0) + 1;
  });
  const summary = advertiser.evidenceSummary;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-4">Resumen de respaldo</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
            <div className="text-[22px] font-semibold text-green-800 tabular-nums">
              {summary.verified}
            </div>
            <div className="text-[11px] text-green-700 mt-0.5">Completo</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
            <div className="text-[22px] font-semibold text-amber-900 tabular-nums">
              {summary.partial}
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">Parcial</div>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
            <div className="text-[22px] font-semibold text-red-800 tabular-nums">
              {summary.insufficient}
            </div>
            <div className="text-[11px] text-red-700 mt-0.5">Insuficiente</div>
          </div>
        </div>
        <p className="text-[12.5px] text-gray-500 leading-relaxed">
          Máxima confianza: apariciones con cita en el programa y atención medida cuando hay
          captura en vivo. El respaldo describe prueba observable — no cumplimiento contractual.
        </p>
      </div>
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-4">Por aparición</h2>
        <ul className="flex flex-col gap-3">
          {Object.entries(fromDetail)
            .sort((a, b) => b[1] - a[1])
            .map(([level, count]) => (
              <li key={level} className="flex items-center justify-between text-[13px]">
                <Badge tone={evidenceTone(level)}>{evidenceLabel(level)}</Badge>
                <span className="tabular-nums text-gray-600">{count}</span>
              </li>
            ))}
        </ul>
        {Object.keys(byEvidence).length > 0 && (
          <p className="text-[11px] text-gray-400 mt-4">
            Export consolidado:{" "}
            {Object.entries(byEvidence)
              .map(([k, v]) => `${EVIDENCE_SHORT[k as keyof typeof EVIDENCE_SHORT] || k}: ${v}`)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function InformesSection({
  report,
  campaignSlug,
  campaignReport,
  chName,
}: {
  report: BrandReport;
  campaignSlug: string | null;
  campaignReport: BrandReport | null;
  chName: Record<string, string>;
}) {
  const detail = report.detail || [];
  const programs = new Set(detail.map((d) => d.video_id)).size;
  const reach = detail.reduce((a, d) => a + Number(d.views || 0), 0);
  const byChannel = useMemo(() => {
    const m: Record<string, number> = {};
    detail.forEach((d) => {
      const ch = String(d.channel || "");
      m[ch] = (m[ch] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [detail]);
  const topChannel = byChannel[0] ? chName[byChannel[0][0]] || byChannel[0][0] : "—";

  function downloadMarcaPDF() {
    const html = buildReportHTML(report as Parameters<typeof buildReportHTML>[0], {
      reach,
      programs,
      topChannel,
      chName,
    });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  }

  return (
    <div className="max-w-2xl">
      {campaignSlug && campaignReport ? (
        <div className="card p-6 mb-5">
          <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-2">
            Informe de entrega publicado
          </div>
          <h2 className="text-[18px] font-semibold text-ink mb-2">
            {campaignReport.scope?.marca || campaignReport.name}
          </h2>
          {campaignReport.scope?.desde && campaignReport.scope?.hasta && (
            <p className="text-[13px] text-gray-500 mb-3">
              Período de pauta:{" "}
              {formatScopePeriod(campaignReport.scope.desde, campaignReport.scope.hasta)}
            </p>
          )}
          <p className="text-[14px] text-gray-700 leading-relaxed mb-5">
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
              ↓ Descargar informe de entrega
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-5">
          <h2 className="text-[16px] font-semibold text-ink mb-2">Informe de entrega</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
            No hay un informe de campaña publicado para esta marca. Podés generar un resumen PDF
            con la actividad detectada en el período capturado.
          </p>
          <button type="button" className="btn btn-primary" onClick={downloadMarcaPDF}>
            ↓ Descargar resumen PDF
          </button>
        </div>
      )}

      <p className="text-[12.5px] text-gray-500">
        El informe de entrega es el wedge comercial: auditoría de pauta con cita, minuto y
        concurrentes. Se arma desde el perfil de la marca, no desde un módulo de campañas.
      </p>
    </div>
  );
}

export default function BrandProfileSections(props: SectionProps) {
  const {
    tab,
    slug,
    advertiser,
    report,
    chName,
    moments,
    campaignSlug,
    campaignReport,
    onOpenMoment,
    allReports,
    channelScope,
  } = props;

  switch (tab) {
    case "resumen":
      return <ResumenSection report={report} chName={chName} />;
    case "apariciones":
      return (
        <div>
          <ActivationsTable
            variant="brand"
            rows={report.detail || []}
            chName={chName}
            onRowClick={onOpenMoment}
            title={`Apariciones · ${report.name}`}
            subtitle="clic en una fila → Momento de Atención"
          />
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
            Solo lecturas de pauta verificadas. El link abre el VOD en el segundo exacto.
          </p>
        </div>
      );
    case "programas":
      return (
        <ProgramasSection
          reports={allReports}
          moments={moments}
          brandSlug={slug}
          chName={chName}
          channelScope={channelScope}
        />
      );
    case "canales":
      return <CanalesSection report={report} chName={chName} />;
    case "audiencia":
      return (
        <AudienciaSection report={report} chName={chName} onOpenMoment={onOpenMoment} />
      );
    case "evidencia":
      return <EvidenciaSection advertiser={advertiser} report={report} />;
    case "videos":
      return (
        <VideosSection
          reports={allReports}
          moments={moments}
          brandSlug={slug}
          chName={chName}
          channelScope={channelScope}
        />
      );
    case "informes":
      return (
        <InformesSection
          report={report}
          campaignSlug={campaignSlug}
          campaignReport={campaignReport}
          chName={chName}
        />
      );
    default:
      return null;
  }
}
