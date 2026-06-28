"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaAlertCard from "@/components/agencia/AgenciaAlertCard";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaFeaturedMoment from "@/components/agencia/AgenciaFeaturedMoment";
import AgenciaPairShowcase from "@/components/agencia/AgenciaPairShowcase";
import AgenciaSlotExplorer from "@/components/agencia/AgenciaSlotExplorer";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildBrandSlots } from "@/lib/agencia-donde";
import type { ShowcaseConfig } from "@/lib/agencia-showcase";
import { buildAgenciaAlerts, buildRubroShare, markCompetitorsInRubro } from "@/lib/agencia-product";
import { buildShowOpportunities } from "@/lib/opportunity";
import { compact, vodLink } from "@/lib/format";
import type { PlacementExport } from "@/lib/placement";
import { useCorpus } from "@/lib/useCorpus";

type ReportSlice = {
  name?: string;
  mentions?: number;
  value_usd?: number;
  best?: never;
  detail?: never[];
};

type Props = {
  showcase: ShowcaseConfig;
};

export default function AgenciaShowcaseView({ showcase }: Props) {
  const { brands, reports, channels, audience, moments, placement, meta } = useCorpus([
    "brands",
    "reports",
    "channels",
    "audience",
    "moments",
    "placement",
    "meta",
  ] as const);

  const reportsMap = reports as Record<string, never>;
  const client = reportsMap[showcase.clientSlug] as ReportSlice;
  const competitor = reportsMap[showcase.competitorSlug] as ReportSlice;

  const alerts = useMemo(
    () => buildAgenciaAlerts(showcase.pairs, reportsMap),
    [showcase.pairs, reports]
  );

  const rubroRows = useMemo(
    () =>
      markCompetitorsInRubro(
        buildRubroShare(showcase.rubro, brands as never[], reportsMap, [
          showcase.clientSlug,
          showcase.competitorSlug,
        ]),
        [showcase.competitorSlug]
      ),
    [showcase, brands, reports]
  );

  const opportunities = useMemo(
    () =>
      buildShowOpportunities(
        channels as never,
        audience as never,
        reportsMap,
        moments as never,
        placement as PlacementExport,
        4,
        showcase.rubro
      ),
    [channels, audience, reports, moments, placement, showcase.rubro]
  );

  const clientSlots = useMemo(
    () => buildBrandSlots(showcase.clientSlug, client, "cliente"),
    [showcase.clientSlug, client]
  );
  const competitorSlots = useMemo(
    () => buildBrandSlots(showcase.competitorSlug, competitor, "competidor"),
    [showcase.competitorSlug, competitor]
  );

  const clientShare = rubroRows.find((r) => r.slug === showcase.clientSlug);
  const competitorShare = rubroRows.find((r) => r.slug === showcase.competitorSlug);

  const names = {
    [showcase.clientSlug]: showcase.clientName,
    [showcase.competitorSlug]: showcase.competitorName,
  };

  return (
    <div className="pb-14 max-w-3xl">
      <div className="rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent-soft/80 to-white p-6 mb-8">
        <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-2">
          Demo · {showcase.subtitle}
        </p>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-ink leading-tight">
          {showcase.title}
        </h1>
        <p className="text-[14px] text-gray-600 mt-3 leading-relaxed">{showcase.hook}</p>
        <ul className="mt-4 space-y-1.5 text-[13px] text-gray-600">
          {showcase.why.map((w) => (
            <li key={w} className="flex gap-2">
              <span className="text-accent">✓</span>
              {w}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-gray-400 mt-4">
          Corpus{" "}
          {(meta as { exported_at?: string }).exported_at
            ? new Date((meta as { exported_at: string }).exported_at).toLocaleString("es-AR")
            : "—"}
        </p>
      </div>

      <section className="mb-12">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Paso 1</p>
        <h2 className="text-[18px] font-semibold text-ink mb-2">ECO Guard — alertas</h2>
        <p className="text-[13px] text-gray-500 mb-5">
          Push con concurrentes al segundo — tu marca y el rival.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AgenciaAlertCard
              key={alert.id}
              alert={alert}
              role={alert.brandSlug === showcase.clientSlug ? "cliente" : "competidor"}
            />
          ))}
        </div>
      </section>

      {client?.best && (
        <section className="mb-12">
          <AgenciaFeaturedMoment
            brandName={showcase.clientName}
            brandSlug={showcase.clientSlug}
            competitorName={showcase.competitorName}
            competitorSlug={showcase.competitorSlug}
            best={client.best}
          />
        </section>
      )}

      <section className="mb-12 card p-6">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Paso 2</p>
        <h2 className="text-[18px] font-semibold text-ink mb-4">Tu marca vs rival</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-4">
            <AgenciaBrandRoleBadge role="cliente" className="mb-2" />
            <p className="text-[17px] font-semibold">{showcase.clientName}</p>
            <p className="text-[13px] text-gray-600 mt-2 tabular-nums">
              {client?.mentions ?? 0} PNT · USD{" "}
              {Math.round(client?.value_usd ?? 0).toLocaleString("es-AR")}
            </p>
            {clientShare && (
              <p className="text-[13px] font-medium text-accent mt-2">
                {clientShare.sharePct.toFixed(0)}% share atención
              </p>
            )}
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <AgenciaBrandRoleBadge role="competidor" className="mb-2" />
            <p className="text-[17px] font-semibold">{showcase.competitorName}</p>
            <p className="text-[13px] text-gray-600 mt-2 tabular-nums">
              {competitor?.mentions ?? 0} PNT · USD{" "}
              {Math.round(competitor?.value_usd ?? 0).toLocaleString("es-AR")}
            </p>
            {competitorShare && (
              <p className="text-[13px] font-medium text-amber-900 mt-2">
                {competitorShare.sharePct.toFixed(0)}% share atención
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Paso 3</p>
        <h2 className="text-[18px] font-semibold text-ink mb-4">Dónde pautar · explorá slots</h2>
        <AgenciaSlotExplorer
          slots={[...clientSlots, ...competitorSlots]}
          title={`Tocá cada aparición · ${showcase.clientName}`}
        />
        {opportunities.length > 0 && (
          <div className="grid gap-2">
            {opportunities.slice(0, 2).map((o) => (
              <div key={o.id} className="card p-3 text-[12.5px] text-gray-600">
                <strong className="text-ink">{o.showName}</strong> · {o.channelName} · pico{" "}
                {compact(o.peakAttention)} · {o.gapLabel}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Paso 4</p>
        <AgenciaPairShowcase
          pair={showcase.pairs[0]}
          clientReport={client}
          competitorReport={competitor}
          rubroRows={rubroRows}
          names={names}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={`${AGENCIA_BASE}/ejemplo`} className="btn border border-[#ececec] text-[13px]">
          ← Todos los ejemplos
        </Link>
        <Link
          href={`${AGENCIA_BASE}/marcas/${showcase.clientSlug}`}
          className="btn btn-primary text-[13px]"
        >
          Ficha {showcase.clientName}
        </Link>
      </div>
    </div>
  );
}
