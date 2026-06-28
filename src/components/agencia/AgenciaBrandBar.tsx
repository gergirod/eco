"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { brandDisplayName } from "@/lib/agencia-roles";
import { useActiveBrand } from "@/lib/use-active-brand";
import { useCorpus } from "@/lib/useCorpus";

export default function AgenciaBrandBar() {
  const { activePair, activeSlug, config, setActiveBrand } = useActiveBrand();
  const { brands } = useCorpus(["brands"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  if (!activePair || !activeSlug) return null;

  const multiBrand = config.brandSlugs.length > 1;
  const rivalName = activePair.competitorSlug
    ? brandDisplayName(activePair.competitorSlug, names)
    : null;

  return (
    <div className="mb-6 rounded-xl border border-[#ececec] bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
            Mirando ahora
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[16px] font-semibold text-ink">
              {brandDisplayName(activeSlug, names)}
            </span>
            {rivalName ? (
              <>
                <span className="text-gray-300">vs</span>
                <span className="text-[14px] text-gray-600">{rivalName}</span>
                <AgenciaBrandRoleBadge role="competidor" className="!text-[9px]" />
              </>
            ) : (
              <span className="text-[12px] text-gray-400">sin rival · solo tu cliente</span>
            )}
          </div>
        </div>
        <Link
          href={`${AGENCIA_BASE}/elegir`}
          className="text-[12px] text-accent font-medium hover:underline shrink-0"
        >
          Cambiar marca
        </Link>
      </div>

      {multiBrand && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {config.pairs.map((pair) => (
            <button
              key={pair.slug}
              type="button"
              onClick={() => setActiveBrand(pair.slug)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                pair.slug === activeSlug
                  ? "border-accent/40 bg-accent-soft text-accent font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {brandDisplayName(pair.slug, names)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
