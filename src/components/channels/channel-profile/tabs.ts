/** ARCH-001 — superficies del perfil de canal. */

export const CHANNEL_PROFILE_TABS = [
  { id: "descripcion", label: "Descripción" },
  { id: "formatos", label: "Formatos" },
  { id: "programas", label: "Emisiones" },
  { id: "marcas", label: "Marcas activas" },
  { id: "actividad", label: "Actividad comercial" },
  { id: "audiencia", label: "Audiencia" },
  { id: "comparaciones", label: "Comparaciones" },
  { id: "evidencia", label: "Evidencia" },
] as const;

export type ChannelProfileTabId = (typeof CHANNEL_PROFILE_TABS)[number]["id"];

export function parseChannelProfileTab(value: string | null): ChannelProfileTabId {
  const found = CHANNEL_PROFILE_TABS.find((t) => t.id === value);
  return found?.id ?? "descripcion";
}
