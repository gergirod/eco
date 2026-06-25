/** ARCH-001 — superficies del perfil de marca (no módulos de nav). */

export const BRAND_PROFILE_TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "apariciones", label: "Apariciones" },
  { id: "programas", label: "Programas" },
  { id: "canales", label: "Canales" },
  { id: "audiencia", label: "Audiencia" },
  { id: "evidencia", label: "Evidencia" },
  { id: "videos", label: "Videos" },
  { id: "informes", label: "Informes" },
] as const;

export type BrandProfileTabId = (typeof BRAND_PROFILE_TABS)[number]["id"];

export function parseBrandProfileTab(value: string | null): BrandProfileTabId {
  const found = BRAND_PROFILE_TABS.find((t) => t.id === value);
  return found?.id ?? "resumen";
}
