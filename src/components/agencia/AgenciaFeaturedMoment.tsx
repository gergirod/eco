import Link from "next/link";
import { compact, vodLink } from "@/lib/format";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";

type Activation = {
  channel_name?: string;
  date?: string;
  video_id?: string;
  minute?: string;
  t_seconds?: number;
  quote?: string;
  tier_label?: string;
  conc_at?: number | null;
  program_peak?: number | null;
  sentiment?: string;
};

type Props = {
  brandName: string;
  brandSlug: string;
  competitorName?: string;
  competitorSlug?: string;
  best: Activation;
};

export default function AgenciaFeaturedMoment({
  brandName,
  brandSlug,
  competitorName,
  competitorSlug,
  best,
}: Props) {
  const peakPct =
    best.program_peak && best.conc_at && best.program_peak > 0
      ? Math.round((best.conc_at / best.program_peak) * 100)
      : null;

  return (
    <section className="rounded-2xl border-2 border-accent/30 bg-white overflow-hidden shadow-[0_8px_32px_rgba(47,95,224,0.1)]">
      <div className="px-5 sm:px-6 py-3 bg-accent text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AgenciaBrandRoleBadge role="cliente" className="!bg-white/20 !text-white !border-white/30" />
          <span className="text-[14px] font-semibold">Ejemplo estrella · {brandName}</span>
        </div>
        <span className="text-[12px] opacity-90">{best.date} · {best.channel_name}</span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Mirando en el minuto", value: best.conc_at ? compact(best.conc_at) : "—" },
            { label: "Formato", value: best.tier_label || "—" },
            { label: "% del pico", value: peakPct != null ? `${peakPct}%` : "—" },
            { label: "Minuto exacto", value: best.minute || "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="text-[22px] sm:text-[26px] font-semibold text-ink tabular-nums leading-none">
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-400 mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {best.quote && (
          <blockquote className="text-[15px] sm:text-[16px] text-ink leading-relaxed italic border-l-4 border-accent pl-4 mb-5">
            &ldquo;{best.quote.slice(0, 280)}
            {best.quote.length > 280 ? "…" : ""}&rdquo;
          </blockquote>
        )}

        <div className="flex flex-wrap gap-2">
          {best.video_id && (
            <a
              href={vodLink(best.video_id, best.t_seconds ?? 0)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-[13px]"
            >
              Link al segundo exacto ↗
            </a>
          )}
          <Link href={`${AGENCIA_BASE}/marcas/${brandSlug}`} className="btn border border-[#ececec] text-[13px]">
            Evidencia completa
          </Link>
          {competitorSlug && competitorName && (
            <Link
              href={`${AGENCIA_BASE}/marcas/${competitorSlug}`}
              className="btn border border-amber-200 bg-amber-50 text-amber-900 text-[13px]"
            >
              vs {competitorName} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
