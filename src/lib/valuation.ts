/** Texto y helpers: exposición estimada en rango (benchmark, no factura). */

import { usd } from "@/lib/format";

/** CPM de referencia host-read en vivo (punto medio del rango). */
export const VALUATION_CPM = 30;
export const VALUATION_CPM_LOW = 25;
export const VALUATION_CPM_HIGH = 35;

export const VALUATION_NOTICE_TITLE = "Qué significa la exposición en USD";

export const VALUATION_BULLETS = {
  what: "Es un benchmark estimado de exposición publicitaria. No es lo que la marca pagó, ni facturación, ni ventas atribuidas.",
  measured:
    "Medimos nosotros: espectadores conectados en el minuto exacto de la aparición, la cita textual en el programa y el formato de la pauta (al pasar / lectura dedicada / con código).",
  formula: `(concurrentes en vivo ÷ 1.000) × CPM de referencia × formato × sentimiento`,
  range: `Mostramos un rango (no un número fijo) usando CPM USD ${VALUATION_CPM_LOW}–${VALUATION_CPM_HIGH} por mil espectadores — punto medio ${VALUATION_CPM}. No hay tarifa pública única; el rango refleja esa incertidumbre.`,
  source:
    "Origen del CPM: calibración contra tarifas de mercado de PNT en shows top (~USD 3.000 por aparición) y benchmarks globales de host-read en vivo (USD 25–40). No usamos CPM de streaming programático (pre-roll, USD 10–20). Ver MODELO-VALORIZACION.md.",
} as const;

export const VALUATION_HINT = `Estimado · rango CPM USD ${VALUATION_CPM_LOW}–${VALUATION_CPM_HIGH} · no es lo que pagó la marca`;

export const VALUATION_INFO = `${VALUATION_BULLETS.what}

${VALUATION_BULLETS.measured}

Fórmula: ${VALUATION_BULLETS.formula}

${VALUATION_BULLETS.range}

${VALUATION_BULLETS.source}`;

export const VALUATION_INFO_SHORT =
  "Benchmark en rango. No es facturación ni lo que pagó el anunciante.";

/** Convierte valor calculado al CPM medio → rango min/max. */
export function exposureRange(valueMid: number) {
  const mid = Math.max(0, valueMid || 0);
  return {
    mid: Math.round(mid),
    min: Math.round(mid * (VALUATION_CPM_LOW / VALUATION_CPM)),
    max: Math.round(mid * (VALUATION_CPM_HIGH / VALUATION_CPM)),
  };
}

/** "US$ 5.700 – 8.000" o "≈ US$ 0" */
export function usdEst(valueMid: number, compact = false): string {
  const { min, max, mid } = exposureRange(valueMid);
  if (mid <= 0) return "≈ US$ 0";
  if (min === max) return `≈ ${usd(mid)}`;
  const prefix = compact ? "" : "≈ ";
  return `${prefix}${usd(min)} – ${usd(max)}`;
}

/** Suma rangos de varias menciones/marcas. */
export function exposureRangeSum(values: number[]) {
  let min = 0;
  let max = 0;
  let mid = 0;
  for (const v of values) {
    const r = exposureRange(v);
    min += r.min;
    max += r.max;
    mid += r.mid;
  }
  return { min, max, mid };
}

export function usdEstSum(values: number[]): string {
  const { min, max, mid } = exposureRangeSum(values);
  if (mid <= 0) return "≈ US$ 0";
  if (min === max) return `≈ ${usd(mid)}`;
  return `≈ ${usd(min)} – ${usd(max)}`;
}
