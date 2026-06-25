/** Texto y helpers: exposición estimada en rango (benchmark, no factura). */

import { usd } from "@/lib/format";

/** CPM de referencia host-read en vivo (punto medio del rango). */
export const VALUATION_CPM = 30;
export const VALUATION_CPM_LOW = 25;
export const VALUATION_CPM_HIGH = 35;

export const VALUATION_HINT = `Estimado · CPM ref. USD ${VALUATION_CPM_LOW}–${VALUATION_CPM_HIGH} · no es lo que pagó la marca`;

export const VALUATION_INFO = `No es lo que la marca pagó ni facturación.

Es un benchmark estimado: cuánto valdría esa aparición si la compraras hoy al precio de referencia del streaming en vivo (host-read / integración en canal).

Fórmula: (personas mirando en el minuto exacto ÷ 1.000) × CPM × formato de pauta × sentimiento.

Mostramos un rango (USD ${VALUATION_CPM_LOW}–${VALUATION_CPM_HIGH} por mil espectadores) porque no hay tarifa pública única: el streaming programático ronda USD 10–20, pero una PNT leída en vivo en show top calibra ~USD 30–33 contra tarifas de ~USD 3.000 por aparición.

Medimos la audiencia real del minuto (no el promedio del programa).`;

export const VALUATION_INFO_SHORT =
  "Exposición estimada en rango. No es facturación ni lo que pagó el anunciante.";

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
