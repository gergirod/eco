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
  const salioFlojo = peakPct != null && peakPct < 40;

  const metaLine = [alert.brandName, alert.channel, alert.program].filter(Boolean).join(" · ");

  return (
    <article className="rounded-2xl border border-[#dcf8c6] bg-[#f0fff4] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#075e54] text-white flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium flex items-center gap-2">
          Para reenviar al cliente
          <AgenciaBrandRoleBadge role={role} className="!bg-white/15 !text-white !border-white/25 !text-[9px]" />
        </span>
        <span className="text-[11px] opacity-80">{alert.date}</span>
      </div>
      <div className="p-4 sm:p-5">
        {alert.concAt ? (
          <p className="text-[32px] font-bold tabular-nums text-ink tracking-tight leading-none mb-1">
            {compact(alert.concAt)}
            <span className="text-[14px] font-normal text-gray-500 ml-2">mirando</span>
          </p>
        ) : null}
        <p className="text-[15px] font-semibold text-ink mt-2">{metaLine}</p>
        {alert.quote && (
          <p className="text-[14px] text-gray-700 leading-relaxed mt-2 italic line-clamp-3">
            &ldquo;{alert.quote}&rdquo;
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-[11px] mt-3 mb-4">
          {salioFlojo && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
              Salió flojo
            </span>
          )}
          {alert.tierLabel && (
            <span className="px-2 py-0.5 rounded-full bg-white border border-[#dcf8c6] text-gray-600">
              {alert.tierLabel}
            </span>
          )}
        </div>
        {alert.programPeak ? (
          <AgenciaPeakGauge concAt={alert.concAt} programPeak={alert.programPeak} className="mb-4" />
        ) : null}
        <div className="flex flex-col sm:flex-row gap-2">
          <AgenciaCopyPush alert={alert} />
          <a
            href={yt}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border border-[#ececec] bg-white text-[13px] py-2.5 text-center w-full sm:w-auto"
          >
            Ver en YouTube ↗
          </a>
          <Link
            href={`${AGENCIA_BASE}/marcas/${alert.brandSlug}`}
            className="btn border border-[#ececec] bg-white text-[13px] py-2.5 text-center w-full sm:w-auto sm:hidden"
          >
            Más detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
