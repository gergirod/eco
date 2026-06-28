/**
 * Demos design partner — casos reales del corpus completo (8 canales).
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
    subtitle: "Fintech · Olga + Luzu",
    rubro: "fintech",
    clientSlug: "iol-inversiones",
    clientName: "IOL Inversiones",
    competitorSlug: "mercado-pago",
    competitorName: "Mercado Pago",
    hook: "9 vs 2 PNT · 229k en NDN · chat en Olga",
    channelIds: ["olga", "luzu"],
    why: [
      "9 PNT verificadas IOL vs 2 MP — competencia directa en fintech",
      "IOL en Luzu (229k) y Olga con chat — MP solo Luzu",
      "Share de atención medible — argumento para el viernes",
      "El par más profundo del corpus en talk masivo",
    ],
    pairs: [{ slug: "iol-inversiones", rubro: "fintech", competitorSlug: "mercado-pago" }],
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
      "Mismo rubro energía — comparación cross-canal, no solo talk",
      "Blender ~7k avg vs Olga ~26k: más barato, público más acotado",
      "Neura con chat — lectura dedicada PAE verificable",
    ],
    pairs: [{ slug: "ypf", rubro: "energia", competitorSlug: "pae" }],
  },
  {
    id: "hyundai-adidas",
    title: "Hyundai vs Adidas",
    subtitle: "Vorterix + Olga · rock y charla",
    rubro: "automotriz",
    clientSlug: "hyundai",
    clientName: "Hyundai",
    competitorSlug: "adidas",
    competitorName: "Adidas",
    hook: "8k Olga · 7k Vorterix · mismo fin de semana, públicos distintos",
    channelIds: ["olga", "vorterix"],
    why: [
      "Hyundai y Adidas aparecen en Olga y Vorterix — no es solo Luzu/Olga",
      "Vorterix = rock/cultura · audiencia distinta al talk tradicional",
      "Tier 3 con código en Olga — promo verificable al segundo",
      "Ideal para mostrar Dónde en canal alternativo al bloque matutino",
    ],
    pairs: [{ slug: "hyundai", rubro: "automotriz", competitorSlug: "adidas" }],
  },
  {
    id: "skip-rexona",
    title: "Skip vs Rexona",
    subtitle: "Higiene · Olga + Luzu",
    rubro: "higiene",
    clientSlug: "skip",
    clientName: "Skip",
    competitorSlug: "rexona",
    competitorName: "Rexona",
    hook: "5 vs 5 PNT · mismo rubro, misma semana",
    channelIds: ["olga", "luzu"],
    why: [
      "5 PNT cada uno — la competencia más equilibrada del período",
      "Ambos en Luzu y Olga — comparación justa de share",
      "Skip 75k en Antes Que Nadie — Rexona 42k en Olga",
      "Perfecto para CPG / higiene personal",
    ],
    pairs: [{ slug: "skip", rubro: "higiene", competitorSlug: "rexona" }],
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
    hook: "237k mirando en NDN · valijas vs aerolínea",
    channelIds: ["luzu", "olga"],
    why: [
      "237.826 concurrentes en el minuto de la PNT — número que vende solo",
      "Lectura dedicada Tier 2 — copy de valijas verificable",
      "Rival en Olga con chat capturado — comparación cross-canal",
      "El techo de escala del corpus en un solo slot",
    ],
    pairs: [{ slug: "wanderlust", rubro: "viajes", competitorSlug: "aerolineas-argentinas" }],
  },
  {
    id: "geniol-green-life",
    title: "Geniol vs Green Life",
    subtitle: "Salud / OTC · Olga profundo",
    rubro: "salud",
    clientSlug: "geniol",
    clientName: "Geniol",
    competitorSlug: "green-life",
    competitorName: "Green Life",
    hook: "6 vs 3 PNT · Sería Increíble · copy de dolor verificable",
    channelIds: ["olga"],
    why: [
      "6 PNT Geniol vs 3 Green Life — competencia real en salud/OTC",
      "Todo en Olga (Sería Increíble) — comparación justa en un solo canal",
      "Lectura dedicada con copy largo — buen ejemplo de Tier 2",
      "Ideal para agencia con cliente farmacéutico o OTC",
    ],
    pairs: [{ slug: "geniol", rubro: "salud", competitorSlug: "green-life" }],
  },
];

/** Canales del corpus que aparecen en al menos un demo */
export const SHOWCASE_CHANNEL_IDS = [...new Set(SHOWCASES.flatMap((s) => s.channelIds))];

export function getShowcase(id: string): ShowcaseConfig | undefined {
  return SHOWCASES.find((s) => s.id === id);
}

/** @deprecated use getShowcase('iol-mercado-pago') */
export const SHOWCASE_DEMO = SHOWCASES[0];
export const SHOWCASE_ID = SHOWCASES[0].id;
