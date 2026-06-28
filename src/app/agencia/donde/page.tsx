"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildDondeRubroPack, slotSummary, type BrandSlot } from "@/lib/agencia-donde";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { compact, vodLink } from "@/lib/format";
import { buildShowOpportunities } from "@/lib/opportunity";
import { rubroDisplay } from "@/lib/agencia-product";
import { useCorpus } from "@/lib/useCorpus";
import type { PlacementExport } from "@/lib/placement";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaSlotExplorer from "@/components/agencia/AgenciaSlotExplorer";

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

function OpportunityRow({
  row,
}: {
  row: {
    channelName: string;
    showName: string;
    gapLabel: string;
    peakAttention: number;
    topRubroLabel: string | null;
  };
}) {
  return (
    <article className="card p-4 border-dashed border-accent/25">
      <p className="text-[12px] text-gray-400">{row.channelName}</p>
      <p className="text-[15px] font-semibold text-ink mt-0.5">{row.showName}</p>
      <p className="text-[13px] text-gray-600 mt-2">{row.gapLabel}</p>
      <p className="text-[12px] text-gray-500 mt-2">
        Pico <strong className="text-ink">{compact(row.peakAttention)}</strong>
        {row.topRubroLabel ? ` · charla ${row.topRubroLabel}` : ""}
      </p>
    </article>
  );
}

export default function AgenciaDondePage() {
  const { config } = useAgenciaConfig();
  const { brands, reports, channels, audience, moments, placement, meta } = useCorpus([
    "brands",
    "reports",
    "channels",
    "audience",
    "moments",
    "placement",
    "meta",
  ] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const reportsMap = reports as Record<string, never>;

  const packs = useMemo(
    () =>
      config.pairs.map((pair) => {
        const opps = buildShowOpportunities(
          channels as never,
          audience as never,
          reportsMap,
          moments as never,
          placement as PlacementExport,
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

  return (
    <div className="pb-10 max-w-3xl">
      <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">
        Dónde pautar
      </p>
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">
        Dónde está tu audiencia
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed max-w-xl">
        Programas con gente mirando, slots que ya rindieron para tus marcas, y huecos donde tu rubro
        casi no aparece. Data del corpus — no intuición del comercial.
      </p>

      {packs.map((pack) => (
        <section key={pack.rubroKey} className="mt-10">
          <h2 className="text-[16px] font-semibold text-ink mb-1">{pack.rubroLabel}</h2>
          <p className="text-[13px] text-gray-500 mb-5">
            {pack.clientBrand}
            {pack.competitorName ? ` vs ${pack.competitorName}` : ""}
          </p>

          <AgenciaSlotExplorer
            slots={[...pack.clientSlots, ...pack.competitorSlots]}
            title={`Explorá apariciones · ${pack.clientBrand}`}
          />

          {pack.repeatSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] uppercase tracking-wide text-green-700 font-medium mb-3">
                Repetir · ya rindió
              </h3>
              <div className="grid gap-3">
                {pack.repeatSlots.map((s, i) => (
                  <SlotRow key={`${s.videoId}-${i}`} slot={s} />
                ))}
              </div>
            </div>
          )}

          {pack.avoidSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] uppercase tracking-wide text-amber-800 font-medium mb-3">
                No gastar acá · salió en valle
              </h3>
              <div className="grid gap-3">
                {pack.avoidSlots.map((s, i) => (
                  <SlotRow key={`${s.videoId}-v-${i}`} slot={s} />
                ))}
              </div>
            </div>
          )}

          {pack.competitorSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-3">
                Dónde pauta {pack.competitorName}
              </h3>
              <div className="grid gap-3">
                {pack.competitorSlots.slice(0, 3).map((s, i) => (
                  <SlotRow key={`${s.videoId}-c-${i}`} slot={s} />
                ))}
              </div>
            </div>
          )}

          {pack.opportunities.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-wide text-accent font-medium mb-3">
                Oportunidades · mucha audiencia, poca pauta de tu rubro
              </h3>
              <div className="grid gap-3">
                {pack.opportunities.map((o) => (
                  <OpportunityRow key={o.id} row={o} />
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      <p className="text-[11px] text-gray-400 mt-10 leading-relaxed">
        Corpus {(meta as { exported_at?: string }).exported_at
          ? new Date((meta as { exported_at: string }).exported_at).toLocaleString("es-AR")
          : "—"}
        . Ventana corta — útil para decidir el próximo slot, no para plan anual.
      </p>

      <p className="text-[12px] text-gray-400 mt-4">
        <Link href={AGENCIA_BASE} className="text-accent hover:underline">
          ← Guard
        </Link>
      </p>
    </div>
  );
}
