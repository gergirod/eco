/** Capa 1.5 — eficiencia vs inversión declarada (solo producto marca). */

import { usd } from "@/lib/format";
import { exposureRange, usdEst } from "@/lib/valuation";

/** Referencia de mercado: PNT completa en show top (~MODELO-VALORIZACION). */
export const BENCHMARK_PNT_USD = 3000;

export type EfficiencyResult = {
  inversionUsd: number;
  exposureMid: number;
  mentions: number;
  ratio: number;
  perPntMid: number;
  vsFlatBenchmark: number;
  verdict: "strong" | "ok" | "weak";
  headline: string;
  bullets: string[];
};

export function calcEfficiency(
  inversionUsd: number,
  exposureMid: number,
  mentions: number
): EfficiencyResult | null {
  if (!inversionUsd || inversionUsd <= 0 || exposureMid <= 0) return null;
  const ratio = exposureMid / inversionUsd;
  const perPntMid = mentions > 0 ? exposureMid / mentions : 0;
  const vsFlat = mentions > 0 ? exposureMid / (mentions * BENCHMARK_PNT_USD) : 0;

  let verdict: EfficiencyResult["verdict"] = "ok";
  if (ratio >= 1.2 || vsFlat >= 1) verdict = "strong";
  else if (ratio < 0.7) verdict = "weak";

  const ratioFmt = ratio.toFixed(2).replace(".", ",");
  const headline =
    verdict === "strong"
      ? `Por cada USD 1 invertido, medimos ~USD ${ratioFmt} de exposición (benchmark).`
      : verdict === "weak"
        ? `La exposición medida está por debajo de la inversión declarada (ratio ~${ratioFmt}×).`
        : `Ratio exposición / inversión: ~${ratioFmt}× (benchmark, no ROI de ventas).`;

  const bullets = [
    `Inversión declarada: ${usd(Math.round(inversionUsd))}.`,
    `Exposición medida (punto medio del rango): ${usdEst(exposureMid)} en ${mentions} PNT.`,
    mentions > 0
      ? `Promedio por aparición: ${usdEst(perPntMid)} vs referencia de mercado ~${usd(BENCHMARK_PNT_USD)} por PNT en shows top.`
      : "",
    "Esto compara números fijos — no atribuye ventas ni cupones. Sirve para auditar si la pauta rindió vs lo que se pagó.",
  ].filter(Boolean);

  return {
    inversionUsd,
    exposureMid,
    mentions,
    ratio,
    perPntMid,
    vsFlatBenchmark: vsFlat,
    verdict,
    headline,
    bullets,
  };
}

export function efficiencyHtmlBlock(e: EfficiencyResult): string {
  const { min, max, mid } = exposureRange(e.exposureMid);
  const tone =
    e.verdict === "strong" ? "#0f7d6b" : e.verdict === "weak" ? "#b45309" : "#2f5fe0";
  const bg =
    e.verdict === "strong" ? "#e8f5f1" : e.verdict === "weak" ? "#fffbeb" : "#f0f4ff";
  const border =
    e.verdict === "strong" ? "#cfe9e2" : e.verdict === "weak" ? "#fde68a" : "#dbe4ff";

  return `<div class="efficiency" style="background:${bg};border:1px solid ${border};border-left:4px solid ${tone}">
    <h4 style="color:${tone}">¿Valió la pena? · Inversión vs exposición medida</h4>
    <p class="eff-lead"><b>${e.headline}</b></p>
    <ul class="eff-list">${e.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    <p class="eff-note">Rango de exposición: ${usd(min)} – ${usd(max)} (medio ${usd(mid)}). Solo con inversión declarada por el cliente — no inferimos precios de pauta.</p>
  </div>`;
}

const STORAGE_PREFIX = "eco_inversion_";

export function loadInversion(slug: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slug);
    if (!raw) return null;
    const n = Number(raw);
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function saveInversion(slug: string, usd: number | null) {
  if (typeof window === "undefined") return;
  try {
    if (!usd || usd <= 0) localStorage.removeItem(STORAGE_PREFIX + slug);
    else localStorage.setItem(STORAGE_PREFIX + slug, String(usd));
  } catch {
    /* ignore */
  }
}
