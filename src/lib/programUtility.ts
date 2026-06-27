/** Índice ECO de Programa Útil (IUP) — export de pipeline/program_utility.py */

export type ProgramUtilityTier = "alta" | "media" | "baja" | "insuficiente";

export type ProgramUtilityComponents = {
  capture: number;
  audience: number;
  conversation: number;
  commercial: number;
  participation: number;
  format: number;
};

export type ProgramUtilityRow = {
  video_id: string;
  channel: string;
  channel_id: string;
  title: string;
  date?: string;
  iup: number;
  tier: ProgramUtilityTier;
  components: ProgramUtilityComponents;
  detail: Record<string, unknown>;
  weights: Record<string, number>;
};

export type ProgramUtilityExport = {
  version: number;
  name: string;
  label: string;
  description: string;
  weights: Record<string, number>;
  tiers: Record<ProgramUtilityTier, string>;
  programs: ProgramUtilityRow[];
  by_channel: {
    channel_id: string;
    channel: string;
    programs: number;
    iup_avg: number;
    iup_median: number;
    tier_alta: number;
    tier_insuficiente: number;
  }[];
  totals: {
    programs: number;
    tier_alta: number;
    tier_media: number;
    tier_baja: number;
    tier_insuficiente: number;
  };
};

export const IUP_WEIGHTS: { id: keyof ProgramUtilityComponents; label: string; pct: number }[] = [
  { id: "capture", label: "Captura", pct: 25 },
  { id: "audience", label: "Audiencia", pct: 25 },
  { id: "conversation", label: "Conversación", pct: 25 },
  { id: "commercial", label: "Comercial", pct: 15 },
  { id: "participation", label: "Participación", pct: 10 },
  { id: "format", label: "Formato", pct: 5 },
];

export const IUP_METHODOLOGY = {
  title: "Índice ECO de Programa Útil (IUP)",
  /** Aclaración de vocabulario — alineado a /canales tab Programas */
  vocabulary:
    "Programa = el show (ej. Soñé Que Volaba). Emisión = un vivo puntual que capturamos (un video_id, una fecha). El IUP es por emisión, no por show. Si trackeamos SQV 8 veces, tenés 8 IUP distintos; el promedio del canal es sobre esas emisiones.",
  intro:
    "Score 0–100 de esta emisión en vivo: ¿aporta inteligencia al corpus o es filler? Mira captura completa, atención real, temas, señales comerciales y chat de esa tarde — no la calidad editorial del show ni un rating acumulado.",
  components: [
    {
      id: "capture",
      label: "Captura (25%)",
      source: "transcript, topics, viewers/, meta/",
      how: "¿Tenemos audio transcrito, extracción LLM, concurrentes en vivo y duración ≥20 min? Sin captura live el techo baja mucho.",
    },
    {
      id: "audience",
      label: "Audiencia (25%)",
      source: "viewers/{id}.json",
      how: "Promedio y pico de concurrentes minuto a minuto (solo vivo). Escala logarítmica: ~50k avg ≈ tope; sin concurrentes = 0.",
    },
    {
      id: "conversation",
      label: "Conversación (25%)",
      source: "topics/{id}.json",
      how: "Bloques del transcript con temas, marcas, señales de demanda o demanda del chat; más top_temas = más señal.",
    },
    {
      id: "commercial",
      label: "Comercial (15%)",
      source: "topics/{id}.json",
      how: "Menciones patrocinadas, orgánicas y productos/marcas detectados por el LLM. ~6 señales comerciales ≈ saturación.",
    },
    {
      id: "participation",
      label: "Participación (10%)",
      source: "chat/{id}.jsonl + viewers/",
      how: "Mensajes de chat por 1.000 concurrentes por minuto (engagement). Penaliza ruido/spam detectado en la sala.",
    },
    {
      id: "format",
      label: "Formato (5%)",
      source: "show_format (título + canal)",
      how: "Show reconocido en la grilla (NDN, AQN, etc.) vs genérico “otros”. Ayuda a comparar emisiones del mismo formato.",
    },
  ] as const,
  tiers: [
    { id: "alta" as const, range: "≥70", note: "captura ok — alimenta radar, marcas y benchmark con confianza" },
    { id: "media" as const, range: "45–69", note: "útil para temas y exploración" },
    { id: "baja" as const, range: "25–44", note: "marginal; revisar si conviene capturar la franja" },
    {
      id: "insuficiente" as const,
      range: "<25 o captura incompleta",
      note: "filler, VOD sin live, o pipeline parcial",
    },
  ],
  formula:
    "IUP = 100 × (0,25×captura + 0,25×audiencia + 0,25×conversación + 0,15×comercial + 0,10×participación + 0,05×formato). Cada componente va de 0 a 1 antes de ponderar.",
};

export function getProgramUtility(
  exportData: ProgramUtilityExport | null | undefined,
  videoId: string
): ProgramUtilityRow | null {
  if (!exportData?.programs?.length) return null;
  return exportData.programs.find((p) => p.video_id === videoId) ?? null;
}

export function getChannelUtilitySummary(
  exportData: ProgramUtilityExport | null | undefined,
  channelId: string
) {
  if (!exportData?.by_channel?.length) return null;
  return exportData.by_channel.find((c) => c.channel_id === channelId) ?? null;
}

export function tierLabel(tier: ProgramUtilityTier): string {
  const labels: Record<ProgramUtilityTier, string> = {
    alta: "Alta utilidad",
    media: "Utilidad media",
    baja: "Utilidad baja",
    insuficiente: "Insuficiente",
  };
  return labels[tier];
}

export function tierTone(tier: ProgramUtilityTier): "green" | "blue" | "amber" | "gray" | "red" {
  const tones: Record<ProgramUtilityTier, "green" | "blue" | "amber" | "gray" | "red"> = {
    alta: "green",
    media: "blue",
    baja: "amber",
    insuficiente: "gray",
  };
  return tones[tier];
}

export function componentDetailText(
  row: ProgramUtilityRow,
  componentId: keyof ProgramUtilityComponents
): string {
  const d = row.detail?.[componentId] as Record<string, unknown> | undefined;
  if (!d) return "";

  switch (componentId) {
    case "capture": {
      const parts: string[] = [];
      if (d.has_transcript) parts.push("transcript");
      if (d.has_topics) parts.push("temas");
      if (d.has_live_viewers) parts.push("concurrentes live");
      else parts.push("sin concurrentes live");
      if (d.duration_ok === false) parts.push("duración corta");
      return parts.join(" · ");
    }
    case "audience":
      if (d.note) return String(d.note);
      return `avg ${d.avg_concurrent ?? "—"} · pico ${d.peak_concurrent ?? "—"}`;
    case "conversation":
      return `${d.blocks_with_signal ?? 0}/${d.blocks ?? 0} bloques con señal · ${d.top_temas ?? 0} temas top`;
    case "commercial":
      return `${d.brand_mentions ?? 0} marcas · ${d.sponsored ?? 0} pauta · ${d.organic ?? 0} orgánico`;
    case "participation":
      if (d.note) return String(d.note);
      return `engagement ${Number(d.chat_engagement ?? 0).toFixed(2)} msgs/1k/min`;
    case "format":
      return String(d.show_name ?? d.show_id ?? "");
    default:
      return "";
  }
}
