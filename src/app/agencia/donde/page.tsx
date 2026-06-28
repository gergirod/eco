"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildDondeRubroPack, slotSummary, type BrandSlot } from "@/lib/agencia-donde";
import {
  buildProgramMap,
  buildRubroCompetitors,
  portfolioRubroOptions,
} from "@/lib/agencia-mapa";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { compact, vodLink } from "@/lib/format";
import { buildRubroGapHints, buildShowOpportunities } from "@/lib/opportunity";
import { rubroDisplay } from "@/lib/agencia-product";
import { rubroLabel } from "@/lib/placement";
import { useCorpus } from "@/lib/useCorpus";
import type { PlacementExport } from "@/lib/placement";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaCorpusChannels from "@/components/agencia/AgenciaCorpusChannels";
import AgenciaMapaCorpus from "@/components/agencia/AgenciaMapaCorpus";
import AgenciaSlotExplorer from "@/components/agencia/AgenciaSlotExplorer";
import { buildCorpusChannelMatrix } from "@/lib/corpus-channels";

function SlotRow({ slot }: { slot: BrandSlot }) {
  return (
    <article
      className={`card p-4 ${slot.isValley ? "border-amber-300 bg-amber-50/40" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <AgenciaBrandRoleBadge role={slot.role} />
        {slot.isValley && (
          <span className="text-[10px] uppercase font-semibold text-amber-800">No repetir · valle</span>
        )}
      </div>
      <p className="text-[14px] font-semibold text-ink">{slot.channelName}</p>
      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{slot.program}</p>
      <p className="text-[13px] text-gray-700 mt-2">{slotSummary(slot)}</p>
      <p className="text-[11px] text-gray-400 mt-1">{slot.date}</p>
      <div className="flex gap-3 mt-3">
        {slot.videoId && (
          <a
            href={vodLink(slot.videoId, slot.tSeconds)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-accent font-medium hover:underline"
          >
            Evidencia ↗
          </a>
        )}
        <Link
          href={`${AGENCIA_BASE}/marcas/${slot.slug}`}
          className="text-[12px] text-gray-500 hover:text-ink"
        >
          Ficha marca
        </Link>
      </div>
    </article>
  );
}

export default function AgenciaDondePage() {
  const { config } = useAgenciaConfig();
  const [rubro, setRubro] = useState("");
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
  const placementExport = placement as PlacementExport;

  const corpusRows = useMemo(
    () => buildCorpusChannelMatrix(meta as never, channels as never, brands as never),
    [meta, channels, brands]
  );

  const rubroOptions = useMemo(
    () => portfolioRubroOptions(config.pairs, placementExport),
    [config.pairs, placement]
  );

  const clientSlugs = useMemo(() => config.pairs.map((p) => p.slug), [config.pairs]);
  const competitorSlugs = useMemo(
    () => config.pairs.map((p) => p.competitorSlug).filter(Boolean) as string[],
    [config.pairs]
  );

  const competitors = useMemo(
    () =>
      buildRubroCompetitors(
        placementExport,
        reportsMap as never,
        rubro || null,
        clientSlugs,
        competitorSlugs
      ),
    [placement, reports, rubro, clientSlugs, competitorSlugs]
  );

  const programs = useMemo(
    () =>
      buildProgramMap(
        channels as never,
        audience as never,
        reportsMap as never,
        moments as never,
        placementExport,
        rubro || null,
        20
      ),
    [channels, audience, reports, moments, placement, rubro]
  );

  const rubroGaps = useMemo(
    () =>
      buildRubroGapHints(
        channels as never,
        audience as never,
        reportsMap,
        moments as never,
        placementExport,
        8
      ).filter((h) => !rubro || h.rubroKey === rubro),
    [channels, audience, reports, moments, placement, rubro]
  );

  const packs = useMemo(
    () =>
      config.pairs.map((pair) => {
        const opps = buildShowOpportunities(
          channels as never,
          audience as never,
          reportsMap,
          moments as never,
          placementExport,
          5,
          pair.rubro
        );
        return buildDondeRubroPack(
          pair,
          rubroDisplay(pair.rubro),
          reportsMap[pair.slug] as never,
          pair.competitorSlug ? (reportsMap[pair.competitorSlug] as never) : null,
          opps
        );
      }),
    [config.pairs, channels, audience, reports, moments, placement]
  );

  const activeRubroLabel = rubro ? rubroLabel(placementExport, rubro) : "Todos los rubros";

  return (
    <div className="pb-10 max-w-3xl">
      <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">
        Dónde pautar
      </p>
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">
        Mapa del corpus
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed max-w-xl">
        Competencia por rubro, temas de cada programa, canales con audiencia y huecos donde tu
        vertical casi no aparece — 8 canales, data real.
      </p>

      <div className="mt-8">
        <AgenciaCorpusChannels rows={corpusRows} meta={meta as never} />
      </div>

      <div className="mt-10">
        <AgenciaMapaCorpus
          rubro={rubro}
          rubroLabel={activeRubroLabel}
          rubroOptions={rubroOptions}
          onRubroChange={setRubro}
          competitors={competitors}
          programs={programs}
          rubroGaps={rubroGaps}
        />
      </div>

      <section className="mt-14 pt-10 border-t border-gray-100">
        <h2 className="text-[16px] font-semibold text-ink mb-1">Tus marcas · slots concretos</h2>
        <p className="text-[13px] text-gray-500 mb-8">
          Apariciones verificadas, valles a evitar y dónde pauta el rival en tu portfolio.
        </p>

        {packs.map((pack) => (
          <section key={pack.rubroKey} className="mt-10 first:mt-0">
            <h3 className="text-[15px] font-semibold text-ink mb-1">{pack.rubroLabel}</h3>
            <p className="text-[13px] text-gray-500 mb-5">
              {pack.clientBrand}
              {pack.competitorName ? ` vs ${pack.competitorName}` : ""}
            </p>

            <AgenciaSlotExplorer
              slots={[...pack.clientSlots, ...pack.competitorSlots]}
              title={`Explorá apariciones · ${pack.clientBrand}`}
            />

            {pack.repeatSlots.length > 0 && (
              <div className="mb-6 mt-4">
                <h4 className="text-[11px] uppercase tracking-wide text-green-700 font-medium mb-3">
                  Repetir · ya rindió
                </h4>
                <div className="grid gap-3">
                  {pack.repeatSlots.map((s, i) => (
                    <SlotRow key={`${s.videoId}-${i}`} slot={s} />
                  ))}
                </div>
              </div>
            )}

            {pack.avoidSlots.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[11px] uppercase tracking-wide text-amber-800 font-medium mb-3">
                  No gastar acá · salió en valle
                </h4>
                <div className="grid gap-3">
                  {pack.avoidSlots.map((s, i) => (
                    <SlotRow key={`${s.videoId}-v-${i}`} slot={s} />
                  ))}
                </div>
              </div>
            )}

            {pack.competitorSlots.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-3">
                  Dónde pauta {pack.competitorName}
                </h4>
                <div className="grid gap-3">
                  {pack.competitorSlots.slice(0, 3).map((s, i) => (
                    <SlotRow key={`${s.videoId}-c-${i}`} slot={s} />
                  ))}
                </div>
              </div>
            )}

            {pack.opportunities.length > 0 && (
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-accent font-medium mb-3">
                  Oportunidades · {pack.rubroLabel.toLowerCase()}
                </h4>
                <div className="grid gap-3">
                  {pack.opportunities.map((o) => (
                    <article key={o.id} className="card p-4 border-dashed border-accent/25">
                      <p className="text-[12px] text-gray-400">{o.channelName}</p>
                      <p className="text-[15px] font-semibold text-ink mt-0.5">{o.showName}</p>
                      <p className="text-[13px] text-gray-600 mt-2">{o.gapLabel}</p>
                      <p className="text-[12px] text-gray-500 mt-2">
                        Pico <strong className="text-ink">{compact(o.peakAttention)}</strong>
                        {o.topRubroLabel ? ` · charla ${o.topRubroLabel}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </section>

      <p className="text-[11px] text-gray-400 mt-10 leading-relaxed">
        Corpus {(meta as { exported_at?: string }).exported_at
          ? new Date((meta as { exported_at: string }).exported_at).toLocaleString("es-AR")
          : "—"}
        . Ventana corta — útil para el próximo slot, no plan anual.
      </p>

      <p className="text-[12px] text-gray-400 mt-4">
        <Link href={AGENCIA_BASE} className="text-accent hover:underline">
          ← Guard
        </Link>
        {" · "}
        <Link href="/conversacion" className="text-accent hover:underline">
          Temas cross-canal →
        </Link>
      </p>
    </div>
  );
}
