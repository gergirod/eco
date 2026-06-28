/**
 * Demos design partner — pares reales del corpus (misma categoría de producto).
 *
 * Audit jun 2026: Skip (lavado) y Rexona (desodorante) comparten rubro "higiene"
 * en placement pero NO son competidores directos. Green Life es alimentos (mix tartas),
 * no OTC — no usar vs Geniol.
 */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";

export type ShowcaseConfig = {
  id: string;
  title: string;
  subtitle: string;
  rubro: string;
  clientSlug: string;
  clientName: string;
  competitorSlug: string;
  competitorName: string;
  hook: string;
  why: string[];
  /** Canales con PNT en este demo — para badges y matriz */
  channelIds: string[];
  pairs: AgenciaBrandPair[];
};

export const SHOWCASES: ShowcaseConfig[] = [
  {
    id: "iol-mercado-pago",
    title: "IOL vs Mercado Pago",
    subtitle: "Fintech · demo default · broker vs billetera",
    rubro: "fintech",
    clientSlug: "iol-inversiones",
    clientName: "IOL Inversiones",
    competitorSlug: "mercado-pago",
    competitorName: "Mercado Pago",
    hook: "9 vs 2 placas · 229 mil en NDN · banco vs billetera",
    channelIds: ["olga", "luzu"],
    why: [
      "Broker vs billetera — competencia directa, no rubro inventado",
      "9 placas IOL vs 2 MP — el par más completo que tenemos",
      "IOL en Luzu (229k) y Olga — MP en Luzu",
      "Empezá acá si no sabés qué demo elegir",
    ],
    pairs: [{ slug: "iol-inversiones", rubro: "fintech", competitorSlug: "mercado-pago" }],
  },
  {
    id: "mercado-pago-banco-macro",
    title: "Mercado Pago vs Banco Macro",
    subtitle: "Fintech · guerra pareja 2 vs 2 en Luzu",
    rubro: "fintech",
    clientSlug: "mercado-pago",
    clientName: "Mercado Pago",
    competitorSlug: "banco-macro",
    competitorName: "Banco Macro",
    hook: "2 vs 2 placas · ambos en Luzu · billetera vs banco",
    channelIds: ["luzu"],
    why: [
      "2 vs 2 — la pelea fintech más simétrica del corpus",
      "Ambos solo en Luzu — comparación justa, mismo público",
      "~85k MP vs ~73k Macro en el minuto de la PNT",
      "Ideal si el prospect maneja bancos o wallets",
    ],
    pairs: [{ slug: "mercado-pago", rubro: "fintech", competitorSlug: "banco-macro" }],
  },
  {
    id: "smirnoff-schneider",
    title: "Smirnoff vs Schneider",
    subtitle: "Bebidas · alcohol 3 vs 3 en Olga",
    rubro: "bebidas",
    clientSlug: "smirnoff",
    clientName: "Smirnoff",
    competitorSlug: "schneider",
    competitorName: "Schneider",
    hook: "3 vs 3 placas · alcohol · todo Olga",
    channelIds: ["olga"],
    why: [
      "3 vs 3 — competencia real en bebidas/alcohol",
      "Mismo canal (Olga) — comparación limpia",
      "CPG bebidas: fácil de entender en cualquier agencia",
      "Reemplaza pares “higiene” mal clasificados (Skip ≠ Rexona)",
    ],
    pairs: [{ slug: "smirnoff", rubro: "bebidas", competitorSlug: "schneider" }],
  },
  {
    id: "ypf-pae",
    title: "YPF vs PAE",
    subtitle: "Energía · Blender + Olga vs Neura",
    rubro: "energia",
    clientSlug: "ypf",
    clientName: "YPF",
    competitorSlug: "pae",
    competitorName: "PAE",
    hook: "38k Olga · 11k Blender · rival en Neura con 369 mirando",
    channelIds: ["blend", "olga", "neura"],
    why: [
      "YPF en Blender y Olga — PAE solo en Neura: escala vs audiencia B2B directa",
      "Mismo rubro energía — competidores reales del sector",
      "Blender ~7k avg vs Olga ~26k: más barato, público más acotado",
      "Neura con chat — lectura dedicada PAE verificable",
    ],
    pairs: [{ slug: "ypf", rubro: "energia", competitorSlug: "pae" }],
  },
  {
    id: "wanderlust-aerolineas",
    title: "Wanderlust vs Aerolíneas",
    subtitle: "Viajes · wow de escala en Luzu",
    rubro: "viajes",
    clientSlug: "wanderlust",
    clientName: "Wanderlust",
    competitorSlug: "aerolineas-argentinas",
    competitorName: "Aerolíneas Argentinas",
    hook: "237 mil mirando en NDN · valijas vs aerolínea",
    channelIds: ["luzu", "olga"],
    why: [
      "237.826 concurrentes en el minuto de la PNT — número que vende solo",
      "Valijas vs aerolínea — competencia real en viajes",
      "Rival en Olga con chat capturado — comparación cross-canal",
      "El techo de escala del corpus en un solo slot",
    ],
    pairs: [{ slug: "wanderlust", rubro: "viajes", competitorSlug: "aerolineas-argentinas" }],
  },
  {
    id: "geniol",
    title: "Geniol",
    subtitle: "OTC / analgésicos · Olga profundo (sin par simétrico)",
    rubro: "salud",
    clientSlug: "geniol",
    clientName: "Geniol",
    competitorSlug: "green-life",
    competitorName: "Green Life",
    hook: "6 placas · Sería Increíble · analgésico en Olga",
    channelIds: ["olga"],
    why: [
      "6 PNT — el caso OTC más profundo del corpus",
      "Lectura dedicada Tier 2 con copy largo — farmacia en vivo",
      "Green Life en el export es alimentos (mix tartas), no rival OTC — usar solo la ficha Geniol",
      "Para agencia pharma: mostrar profundidad, no share vs Green Life",
    ],
    pairs: [{ slug: "geniol", rubro: "salud", competitorSlug: "green-life" }],
  },
];

/** Demo recomendada por defecto */
export const DEFAULT_SHOWCASE_ID = "iol-mercado-pago";

/** Canales del corpus que aparecen en al menos un demo */
export const SHOWCASE_CHANNEL_IDS = [...new Set(SHOWCASES.flatMap((s) => s.channelIds))];

export function getShowcase(id: string): ShowcaseConfig | undefined {
  const legacy: Record<string, string> = {
    "skip-rexona": "iol-mercado-pago",
    "geniol-green-life": "geniol",
    "hyundai-adidas": "mercado-pago-banco-macro",
  };
  const resolved = legacy[id] ?? id;
  return SHOWCASES.find((s) => s.id === resolved);
}

/** @deprecated use getShowcase('iol-mercado-pago') */
export const SHOWCASE_DEMO = SHOWCASES[0];
export const SHOWCASE_ID = SHOWCASES[0].id;
