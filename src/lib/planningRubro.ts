/** Mapa nombre canal (export) → id para filtros en Planning. */

export const CHANNEL_NAME_TO_ID: Record<string, string> = {
  OLGA: "olga",
  "LUZU TV": "luzu",
  BONDI: "bondi",
  "Bondi Live": "bondi",
  BLENDER: "blend",
  Blender: "blend",
  GELATINA: "gelatina",
  Gelatina: "gelatina",
  "URBANA PLAY": "urbana",
  "Urbana Play": "urbana",
  "NEURA MEDIA": "neura",
  "Neura Media": "neura",
  VORTERIX: "vorterix",
  Vorterix: "vorterix",
  BORDER: "border",
  BorderPeriodismo: "border",
  "Border Periodismo": "border",
  "El Cronista": "cronista",
  "AHORA PLAY": "ahoraplay",
  "Ahora Play": "ahoraplay",
  "A U R A": "aura",
  Aura: "aura",
  Cenital: "cenital",
};

export function channelIdsForRubro(
  placement: { channels?: Record<string, { rubro_mix?: { key: string; count: number }[] }> } | null,
  rubroKey: string
): Set<string> | null {
  if (!rubroKey || !placement?.channels) return null;
  const ids = new Set<string>();
  for (const [id, ch] of Object.entries(placement.channels)) {
    if (ch.rubro_mix?.some((r) => r.key === rubroKey && r.count > 0)) {
      ids.add(id);
    }
  }
  return ids.size ? ids : null;
}

export const PLANNING_RUBRO_OPTIONS = [
  { id: "", label: "Todos los rubros" },
  { id: "fintech", label: "Bancos y plata digital" },
  { id: "bebidas", label: "Bebidas y alcohol" },
  { id: "telco", label: "Telefonía e internet" },
  { id: "retail", label: "Tiendas y ecommerce" },
  { id: "seguros", label: "Seguros" },
  { id: "automotriz", label: "Autos" },
  { id: "energia", label: "Energía y nafta" },
  { id: "salud", label: "Salud y farmacias" },
  { id: "streaming", label: "Streaming y TV" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "alimentos", label: "Alimentos" },
  { id: "higiene", label: "Higiene y cuidado personal" },
  { id: "apuestas", label: "Apuestas y juegos online" },
  { id: "viajes", label: "Viajes y turismo" },
];
