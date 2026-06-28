import Link from "next/link";
import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaRubroPulse from "@/components/agencia/AgenciaRubroPulse";
import AgenciaRivalCompare from "@/components/agencia/AgenciaRivalCompare";
import { compact, vodLink } from "@/lib/format";
import { rubroDisplay, type RubroShareRow } from "@/lib/agencia-product";
import { brandDisplayName } from "@/lib/agencia-roles";

type ReportSlice = {
  name?: string;
  mentions?: number;
  value_usd?: number;
  best?: {
    channel_name?: string;
    date?: string;
    video_id?: string;
    t_seconds?: number;
    quote?: string;
    tier_label?: string;
    conc_at?: number | null;
    program_peak?: number | null;
  };
};

type Props = {
  pair: AgenciaBrandPair;
  clientReport: ReportSlice | null;
  competitorReport: ReportSlice | null;
  rubroRows: RubroShareRow[];
  names: Record<string, string>;
};

function MiniBrandCard({
  slug,
  role,
  report,
  names,
}: {
  slug: string;
  role: "cliente" | "competidor";
  report: ReportSlice | null;
  names: Record<string, string>;
}) {
  const best = report?.best;
  const isClient = role === "cliente";
  const peakPct =
    best?.program_peak && best?.conc_at && best.program_peak > 0
      ? Math.round((best.conc_at / best.program_peak) * 100)
      : null;

  return (
    <article
      className={`flex-1 min-w-[200px] rounded-xl border p-4 ${
        isClient ? "border-accent/30 bg-accent-soft/30" : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <AgenciaBrandRoleBadge role={role} />
        <span className="text-[11px] text-gray-400 tabular-nums">{report?.mentions ?? 0} placas</span>
      </div>
      <h3 className="text-[16px] font-semibold text-ink mb-1">
        {report?.name || brandDisplayName(slug, names)}
      </h3>
      {(report?.value_usd ?? 0) > 0 && (
        <p className="text-[11px] text-gray-400 mb-2">
          Referencia de exposición · USD{" "}
          {Math.round(report!.value_usd!).toLocaleString("es-AR")}
        </p>
      )}
      {best ? (
        <>
          <p className="text-[12px] text-gray-500 mb-2">
            {best.date} · {best.channel_name}
          </p>
          {best.quote && (
            <p className="text-[12.5px] text-gray-700 italic line-clamp-2 mb-3">
              &ldquo;{best.quote.slice(0, 100)}…&rdquo;
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mb-3">
            {best.conc_at ? <span>{compact(best.conc_at)} mirando</span> : null}
            {best.tier_label ? <span>· {best.tier_label}</span> : null}
            {peakPct != null ? <span>· {peakPct}% pico</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${AGENCIA_BASE}/marcas/${slug}`}
              className={`text-[12px] font-medium hover:underline ${isClient ? "text-accent" : "text-amber-800"}`}
            >
              Ver evidencia →
            </Link>
            {best.video_id && (
              <a
                href={vodLink(best.video_id, best.t_seconds ?? 0)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-gray-500 hover:text-ink"
              >
                YouTube ↗
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="text-[12px] text-gray-400">Sin activaciones en el período.</p>
      )}
    </article>
  );
}

export default function AgenciaPairShowcase({
  pair,
  clientReport,
  competitorReport,
  rubroRows,
  names,
}: Props) {
  const compSlug = pair.competitorSlug;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-ink">{rubroDisplay(pair.rubro)}</h2>
        <span className="text-[11px] text-gray-400">
          · {compSlug ? "tu marca vs competidor" : "panorama del rubro"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <MiniBrandCard slug={pair.slug} role="cliente" report={clientReport} names={names} />
        {compSlug ? (
          <>
            <div className="flex items-center justify-center shrink-0 px-1">
              <span className="text-[13px] font-semibold text-gray-300">vs</span>
            </div>
            <MiniBrandCard
              slug={compSlug}
              role="competidor"
              report={competitorReport}
              names={names}
            />
          </>
        ) : null}
      </div>

      {rubroRows.length > 0 && compSlug && (
        <div className="card p-5">
          <h3 className="text-[13px] font-semibold mb-1">Quién se llevó más miradas</h3>
          <p className="text-[12px] text-gray-500 mb-4">En el rubro esta semana — con link al video.</p>
          <AgenciaRivalCompare
            rows={rubroRows}
            clientSlug={pair.slug}
            competitorSlug={compSlug}
          />
        </div>
      )}

      {rubroRows.length > 0 && !compSlug && (
        <AgenciaRubroPulse
          rubroLabel={rubroDisplay(pair.rubro)}
          rows={rubroRows}
          highlightSlugs={[pair.slug]}
        />
      )}
    </section>
  );
}
