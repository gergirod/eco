/**
 * Informe de demanda comercial en chat — link, precio, dónde comprar.
 */

export type CommercialDemandExample = {
  text: string;
  tipo: string;
  count: number;
};

export type CommercialChannelRow = {
  id: string;
  name: string;
  programs_with_chat: number;
  commercial_messages: number;
  chat_messages: number;
  commercial_pct?: number | null;
  commercial_per_1k?: number | null;
  post_pnt_messages?: number;
  by_tipo?: Record<string, number>;
  top_examples?: CommercialDemandExample[];
};

export type PntCorrelation = {
  text: string;
  tipo: string;
  minute: string;
  brand: string;
  pnt_minute: string;
  delta_sec: number;
  brand_in_chat: boolean;
  video_id?: string;
  title?: string;
  channel?: string;
};

export type CommercialProgramRow = {
  video_id: string;
  title: string;
  channel: string;
  channel_id: string;
  commercial_messages: number;
  commercial_pct?: number | null;
  commercial_per_1k?: number | null;
  chat_messages: number;
  post_pnt_messages?: number;
  pnt_brand_aligned?: number;
  pnt_examples?: PntCorrelation[];
  by_tipo?: Record<string, number>;
  top_examples?: CommercialDemandExample[];
};

export type CommercialSignal = {
  text: string;
  tipo: string;
  count: number;
  n_programas: number;
  canales: string[];
  cross_canal: boolean;
};

export type CommercialDemandExport = {
  period?: string;
  disclaimer?: string;
  summary_line?: string | null;
  filter?: {
    llm_used?: boolean;
    llm_rejected?: number;
    llm_confirmed?: number;
    confirmed_total?: number;
  };
  channels: CommercialChannelRow[];
  programs: CommercialProgramRow[];
  top_signals: CommercialSignal[];
  pnt_correlations?: PntCorrelation[];
  channels_with_commercial?: number;
};

export type CommercialDemandChannelSnapshot = {
  id: string;
  name: string;
  commercial_messages: number;
  chat_messages: number;
  commercial_pct?: number | null;
  commercial_per_1k?: number | null;
  post_pnt_messages?: number;
};

export type CommercialDemandSnapshot = {
  exported_at: string;
  confirmed_total: number;
  chat_messages: number;
  commercial_pct?: number | null;
  commercial_per_1k?: number | null;
  channels_with_commercial?: number;
  post_pnt_total?: number;
  channels: CommercialDemandChannelSnapshot[];
};

export type CommercialDemandHistoryExport = {
  updated_at?: string;
  snapshots: CommercialDemandSnapshot[];
};

const TIPO_LABEL: Record<string, string> = {
  pedido_link: "Pide link / código",
  pregunta_precio: "Consulta precio",
  pregunta_compra: "Dónde comprar",
};

export function commercialTipoLabel(tipo: string): string {
  return TIPO_LABEL[tipo] || tipo;
}

export function commercialTipoBreakdown(byTipo?: Record<string, number>): string | null {
  if (!byTipo) return null;
  const parts = (["pedido_link", "pregunta_precio", "pregunta_compra"] as const)
    .filter((k) => (byTipo[k] ?? 0) > 0)
    .map((k) => `${byTipo[k]} ${TIPO_LABEL[k]?.toLowerCase() ?? k}`);
  return parts.length ? parts.join(" · ") : null;
}

export function filterCommercialByChannels(
  data: CommercialDemandExport,
  channelIds: Set<string> | null
): CommercialDemandExport {
  if (!channelIds?.size) return data;
  const channels = data.channels.filter((c) => channelIds.has(c.id));
  const programs = data.programs.filter((p) => channelIds.has(p.channel_id));
  const top_signals = data.top_signals.filter((s) =>
    s.canales.some((name) => {
      const ch = data.channels.find((c) => c.name === name);
      return ch && channelIds.has(ch.id);
    })
  );
  const pnt_correlations = (data.pnt_correlations ?? []).filter((row) => {
    const prog = data.programs.find((p) => p.video_id === row.video_id);
    return prog && channelIds.has(prog.channel_id);
  });
  return { ...data, channels, programs, top_signals, pnt_correlations };
}

export function programsForChannel(
  data: CommercialDemandExport,
  channelId: string,
  limit = 5
): CommercialProgramRow[] {
  return data.programs.filter((p) => p.channel_id === channelId).slice(0, limit);
}

export function channelCommercialRank(
  data: CommercialDemandExport,
  channelId: string
): number | null {
  const idx = data.channels.findIndex((c) => c.id === channelId);
  return idx >= 0 ? idx + 1 : null;
}
