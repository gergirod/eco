/**
 * Cruce ECO (charla en streaming) vs búsquedas en Google Trends (Argentina).
 * Señal de anticipación — no producto standalone (SPEC-008).
 */

export type GtStatus = "adelantado" | "pre_busqueda" | "en_linea" | "ya_masivo";

type RadarGtRow = {
  gt_status?: string | null;
  gt_lead_days?: number | null;
};

export const GT_STATUS_LABEL: Record<GtStatus, string> = {
  adelantado: "El vivo llegó antes que Google",
  pre_busqueda: "Charla en vivo, poca búsqueda",
  en_linea: "Vivo y búsqueda al mismo ritmo",
  ya_masivo: "Google ya venía caliente",
};

export const GT_STATUS_HINT: Record<GtStatus, string> = {
  adelantado:
    "Los streams hablaron del tema antes del despegue en búsquedas en Argentina. Señal de anticipación — no garantía de que vaya a explotar.",
  pre_busqueda:
    "Hay charla en los programas que seguimos, pero Google todavía no registra volumen comparable. Conversación de nicho en vivo.",
  en_linea:
    "El interés en búsqueda y la charla en streaming del período van parejos. El tema ya es relevante en ambos lados.",
  ya_masivo:
    "La búsqueda en Google ya estaba alta antes del pico que vimos en vivo. El streaming refleja agenda pública más que la descubre.",
};

export function isGtStatus(s: string | null | undefined): s is GtStatus {
  return s === "adelantado" || s === "pre_busqueda" || s === "en_linea" || s === "ya_masivo";
}

export function countRadarWithGt(radar: RadarGtRow[]): number {
  return radar.filter((r) => isGtStatus(r.gt_status)).length;
}

export function countRadarGtInteresting(radar: RadarGtRow[]): number {
  return radar.filter(
    (r) => r.gt_status === "adelantado" || r.gt_status === "pre_busqueda"
  ).length;
}

export function isGoogleTrendsInsight(id: string): boolean {
  return id.startsWith("gt-");
}

export const GOOGLE_TRENDS_EXPLAINER = {
  title: "¿Qué agrega el cruce con Google?",
  body: [
    "ECO mide la charla en los streams que capturamos (audio transcrito). Google Trends mide si la gente en Argentina está buscando ese tema en Google — un índice relativo de los últimos 12 meses, no ventas ni audiencia de YouTube.",
    "Cuando marcamos un tema, comparamos en qué momento apareció fuerte en vivo vs cuándo subió la búsqueda. Si el vivo llegó antes, puede ser señal de anticipación. Si Google ya venía caliente, el streaming lo refleja más que lo descubre.",
    "Es contexto para reuniones de pauta o contenido — no es predicción ni recomendación de compra. Muchos temas del ranking no tienen cruce (Google no tiene volumen o el tema es muy de nicho).",
  ],
  offHint:
    "Vista solo streaming: ranking y citas de la charla en vivo, sin comparar con búsquedas en Google.",
};
