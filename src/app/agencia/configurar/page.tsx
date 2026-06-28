"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BrandPortfolioPicker from "@/components/backoffice/BrandPortfolioPicker";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import {
  emptyBrandPair,
  pairsToPartnerPayload,
  type BrandPair,
} from "@/lib/brand-catalog";
import { saveLocalAgenciaSetup } from "@/lib/agencia-setup-storage";
import { PLAN_MAX_BRANDS, normalizePartnerPlan, type PartnerPlan } from "@/lib/partners";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { usePartner } from "@/contexts/PartnerContext";
import placementFile from "@/data/placement.json";

const BRAND_RUBROS = (placementFile as { brand_rubros?: Record<string, string> }).brand_rubros ?? {};

function pairsFromPartner(
  brandSlugs: string[],
  competitorByBrand: Record<string, string> | undefined
): BrandPair[] {
  if (!brandSlugs.length) return [emptyBrandPair()];
  return brandSlugs.map((slug) => ({
    brandSlug: slug,
    competitorSlug: competitorByBrand?.[slug] || "",
  }));
}

export default function AgenciaConfigurarPage() {
  const router = useRouter();
  const { isScoped, partner, refresh, loading: partnerLoading } = usePartner();
  const { config } = useAgenciaConfig();

  const maxBrands = useMemo(() => {
    if (partner?.plan) {
      return PLAN_MAX_BRANDS[normalizePartnerPlan(partner.plan, "agencia")];
    }
    return 3;
  }, [partner?.plan]);

  const [pairs, setPairs] = useState<BrandPair[]>([emptyBrandPair()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (config.brandSlugs.length && !config.isPreview) {
      const byBrand =
        isScoped && partner?.competitor_by_brand
          ? partner.competitor_by_brand
          : undefined;
      setPairs(pairsFromPartner(config.brandSlugs, byBrand));
    }
  }, [config.brandSlugs, config.isPreview, isScoped, partner?.competitor_by_brand]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = pairsToPartnerPayload(pairs);
    if (!payload.brand_slugs.length) {
      setError("Elegí al menos una marca.");
      return;
    }

    setSaving(true);
    try {
      if (isScoped && partner) {
        const res = await fetch("/api/partner/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ pairs }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "No pudimos guardar");
          return;
        }
        await refresh();
      } else {
        const competitorSlugs = [...new Set(Object.values(payload.competitor_by_brand))];
        const setupPairs = payload.brand_slugs.map((slug) => ({
          slug,
          rubro: BRAND_RUBROS[slug] || "otro",
          competitorSlug: payload.competitor_by_brand[slug] || null,
        }));
        saveLocalAgenciaSetup({
          name: config.name,
          brandSlugs: payload.brand_slugs,
          competitorSlugs,
          pairs: setupPairs,
          savedAt: new Date().toISOString(),
        });
      }
      router.push(AGENCIA_BASE);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  if (partnerLoading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  return (
    <div className="max-w-xl pb-10">
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">
        Configurá tu monitoreo
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
        Elegí las marcas de tus clientes y un competidor por marca. Después ves alertas,
        competencia y evidencia solo de esto.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="card p-5">
          <BrandPortfolioPicker value={pairs} onChange={setPairs} maxPairs={maxBrands} />
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar y ver mi cuenta"}
          </button>
          {config.brandSlugs.length > 0 && (
            <Link href={AGENCIA_BASE} className="btn border border-[#ececec] text-[13px]">
              Cancelar
            </Link>
          )}
        </div>
      </form>

      {!isScoped && (
        <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
          Modo prueba local — la config se guarda en este navegador. Con link de acceso ECO se
          guarda en tu cuenta.
        </p>
      )}
    </div>
  );
}
