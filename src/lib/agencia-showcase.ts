/**
 * Demos design partner — 4 casos reales del corpus (marca + rival del dataset).
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
  pairs: AgenciaBrandPair[];
};

export const SHOWCASES: ShowcaseConfig[] = [
  {
    id: "iol-mercado-pago",
    title: "IOL vs Mercado Pago",
    subtitle: "Fintech · el par más profundo del corpus",
    rubro: "fintech",
    clientSlug: "iol-inversiones",
    clientName: "IOL Inversiones",
    competitorSlug: "mercado-pago",
    competitorName: "Mercado Pago",
    hook: "9 vs 2 PNT · 229k en NDN · chat en Olga",
    why: [
      "9 PNT verificadas IOL vs 2 MP — competencia directa en fintech",
      "IOL en Luzu (229k) y Olga con chat — MP solo Luzu",
      "Share de atención medible — argumento para el viernes",
      "Slots buenos y malos para mostrar Dónde",
    ],
    pairs: [{ slug: "iol-inversiones", rubro: "fintech", competitorSlug: "mercado-pago" }],
  },
  {
    id: "wanderlust-aerolineas",
    title: "Wanderlust vs Aerolíneas",
    subtitle: "Viajes · el wow de concurrentes",
    rubro: "viajes",
    clientSlug: "wanderlust",
    clientName: "Wanderlust",
    competitorSlug: "aerolineas-argentinas",
    competitorName: "Aerolíneas Argentinas",
    hook: "237k mirando en NDN · valijas vs aerolínea",
    why: [
      "237.826 concurrentes en el minuto de la PNT — número que vende solo",
      "Lectura dedicada Tier 2 — copy de valijas verificable",
      "Rival en Olga con chat capturado — comparación cross-canal",
      "Ideal si el design partner tiene cliente de turismo",
    ],
    pairs: [{ slug: "wanderlust", rubro: "viajes", competitorSlug: "aerolineas-argentinas" }],
  },
  {
    id: "skip-rexona",
    title: "Skip vs Rexona",
    subtitle: "Higiene · guerra simétrica en streaming",
    rubro: "higiene",
    clientSlug: "skip",
    clientName: "Skip",
    competitorSlug: "rexona",
    competitorName: "Rexona",
    hook: "5 vs 5 PNT · mismo rubro, misma semana",
    why: [
      "5 PNT cada uno — la competencia más equilibrada del período",
      "Ambos en Luzu y Olga — comparación justa de share",
      "Skip 75k en Antes Que Nadie — Rexona 42k en Olga",
      "Perfecto para CPG / higiene personal",
    ],
    pairs: [{ slug: "skip", rubro: "higiene", competitorSlug: "rexona" }],
  },
  {
    id: "geniol-green-life",
    title: "Geniol vs Green Life",
    subtitle: "Salud / OTC · guerra en Olga",
    rubro: "salud",
    clientSlug: "geniol",
    clientName: "Geniol",
    competitorSlug: "green-life",
    competitorName: "Green Life",
    hook: "6 vs 3 PNT · mismo canal Olga · copy de dolor verificable",
    why: [
      "6 PNT Geniol vs 3 Green Life — competencia real en salud/OTC",
      "Ambos en Olga (Sería Increíble y programas top) — comparación justa",
      "Lectura dedicada con copy largo — buen ejemplo de Tier 2",
      "Ideal para agencia con cliente farmacéutico o OTC",
    ],
    pairs: [{ slug: "geniol", rubro: "salud", competitorSlug: "green-life" }],
  },
];

export function getShowcase(id: string): ShowcaseConfig | undefined {
  return SHOWCASES.find((s) => s.id === id);
}

/** @deprecated use getShowcase('iol-mercado-pago') */
export const SHOWCASE_DEMO = SHOWCASES[0];
export const SHOWCASE_ID = SHOWCASES[0].id;
