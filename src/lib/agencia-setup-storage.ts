/** Setup local para probar /agencia sin Supabase (design partner trial). */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";

const KEY = "eco_agencia_setup";

export type LocalAgenciaSetup = {
  name: string;
  brandSlugs: string[];
  competitorSlugs: string[];
  pairs: AgenciaBrandPair[];
  /** Marca en foco en la UI — una pregunta a la vez */
  activeBrandSlug?: string;
  savedAt: string;
};

export function loadLocalAgenciaSetup(): LocalAgenciaSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAgenciaSetup;
    if (!parsed.brandSlugs?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalAgenciaSetup(setup: LocalAgenciaSetup): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(setup));
}

export function clearLocalAgenciaSetup(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function notifyAgenciaSetupChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("eco-agencia-setup"));
}
