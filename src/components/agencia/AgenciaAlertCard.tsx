import Link from "next/link";
import { compact, vodLink } from "@/lib/format";
import type { AgenciaAlert } from "@/lib/agencia-product";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaCopyPush from "@/components/agencia/AgenciaCopyPush";
import AgenciaPeakGauge from "@/components/agencia/AgenciaPeakGauge";
import type { BrandRole } from "@/lib/agencia-roles";

type Props = {
  alert: AgenciaAlert;
  role?: BrandRole;
};

export default function AgenciaAlertCard({ alert, role = "cliente" }: Props) {
  const yt = vodLink(alert.videoId, alert.tSeconds);
  const peakPct =
    alert.programPeak && alert.concAt && alert.programPeak > 0
      ? Math.round((alert.concAt / alert.programPeak) * 100)
      : null;

  return (
    <article className="rounded-2xl border border-[#dcf8c6] bg-[#f0fff4] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#075e54] text-white flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium flex items-center gap-2">
          ECO → WhatsApp
          <AgenciaBrandRoleBadge role={role} className="!bg-white/15 !text-white !border-white/25 !text-[9px]" />
        </span>
        <span className="text-[11px] opacity-80">{alert.date}</span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-[14px] font-semibold text-ink mb-1">{alert.headline}</p>
        <p className="text-[13.5px] text-gray-700 leading-relaxed mb-3">{alert.body}</p>
        <div className="flex flex-wrap gap-2 text-[11px] mb-4">
          <span className="px-2 py-0.5 rounded-full bg-white border border-[#dcf8c6] text-gray-600">
            {alert.tierLabel}
          </span>
          {alert.concAt ? (
            <span className="px-2 py-0.5 rounded-full bg-white border border-[#dcf8c6] text-gray-600">
              {compact(alert.concAt)} concurrentes
            </span>
          ) : null}
          {peakPct != null ? (
            <span className="px-2 py-0.5 rounded-full bg-white border border-[#dcf8c6] text-gray-600">
              {peakPct}% del pico
            </span>
          ) : null}
          <span className="px-2 py-0.5 rounded-full bg-white border border-[#dcf8c6] text-gray-600">
            {alert.evidence === "VERIFIED" ? "✓ Verificado" : "Evidencia parcial"}
          </span>
        </div>
        <AgenciaPeakGauge concAt={alert.concAt} programPeak={alert.programPeak} className="mb-4" />
        <div className="flex flex-wrap gap-2">
          <AgenciaCopyPush alert={alert} />
          <a
            href={yt}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-[13px] py-2"
          >
            Ver segundo exacto ↗
          </a>
          <Link
            href={`${AGENCIA_BASE}/marcas/${alert.brandSlug}`}
            className="btn border border-[#ececec] bg-white text-[13px] py-2"
          >
            Evidencia completa
          </Link>
        </div>
      </div>
    </article>
  );
}
