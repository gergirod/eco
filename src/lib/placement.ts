/** Perfil de canal/show: temas de charla y tipos de marcas que pautan. */

const RUBRO_DISPLAY: Record<string, string> = {
  fintech: "Bancos y plata digital",
  seguros: "Seguros",
  bebidas: "Bebidas y alcohol",
  alimentos: "Alimentos",
  higiene: "Higiene y cuidado personal",
  telco: "Telefonía e internet",
  streaming: "Streaming y TV",
  tecnologia: "Tecnología",
  automotriz: "Autos",
  energia: "Energía y nafta",
  salud: "Salud y farmacias",
  apuestas: "Apuestas y juegos online",
  retail: "Tiendas y ecommerce",
  viajes: "Viajes y turismo",
  otro: "Otro",
};

export type ProgramTopicsRow = {
  video_id: string;
  channel_id: string;
  channel: string;
  title: string;
  show_id: string;
  show_name: string;
  top_temas: { tema: string; score: number }[];
  categorias: { categoria: string; score: number }[];
  samples: { tema: string; categoria: string; contexto: string; minute?: string }[];
};

export type MixRow = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

export type TopicRow = { tema: string; score: number };

export type CategoryRow = { categoria: string; label: string; score: number };

export type ChannelPlacement = {
  rubro_mix: MixRow[];
  top_temas: TopicRow[];
  categoria_mix: CategoryRow[];
  pauta_mentions: number;
};

export type ShowPlacement = ChannelPlacement & {
  channel_id: string;
  show_id: string;
  show_name: string;
  emissions: number;
};

export type PlacementExport = {
  rubro_labels: Record<string, string>;
  brand_rubros: Record<string, string>;
  channels: Record<string, ChannelPlacement>;
  shows: Record<string, ShowPlacement>;
};

export type ProgramTopicsExport = {
  by_video: Record<string, ProgramTopicsRow>;
};

export function rubroLabel(
  placement: PlacementExport | null | undefined,
  rubroId?: string | null
): string {
  if (!rubroId) return "—";
  return RUBRO_DISPLAY[rubroId] || placement?.rubro_labels?.[rubroId] || rubroId;
}

export function getProgramTopics(
  exportData: ProgramTopicsExport | null | undefined,
  videoId: string
): ProgramTopicsRow | null {
  return exportData?.by_video?.[videoId] ?? null;
}

export function getChannelPlacement(
  placement: PlacementExport | null | undefined,
  channelId: string
): ChannelPlacement | null {
  return placement?.channels?.[channelId.toLowerCase()] ?? null;
}

export function getShowPlacement(
  placement: PlacementExport | null | undefined,
  channelId: string,
  showId: string
): ShowPlacement | null {
  const key = `${channelId.toLowerCase()}:${showId}`;
  return placement?.shows?.[key] ?? null;
}

export function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    producto: "Producto",
    lugar: "Lugar",
    persona: "Persona",
    actividad: "Actividad",
    cultura: "Cultura",
    tecnologia: "Tecnología",
    salud: "Salud",
    comida: "Comida",
    economia: "Economía",
    otro: "Otro",
  };
  return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}
