/**
 * Insights cross-canal de chat — interacción, carácter de sala y demanda en vivo.
 */

export type ChatMix = {
  emoji_pct?: number;
  saludo_pct?: number;
  reaccion_pct?: number;
  pregunta_pct?: number;
  demanda_pct?: number;
  obediencia_pct?: number;
  apoyo_pct?: number;
  texto_pct?: number;
};

export type ChatDemandSignal = {
  text: string;
  tipo: string;
  count: number;
  n_programas: number;
  canales: string[];
  cross_canal: boolean;
};

export type ChannelChatInsight = {
  id: string;
  name: string;
  programs_with_chat: number;
  chat_messages: number;
  msgs_per_1k: number | null;
  noise_score: number | null;
  chat_quality_tier?: string;
  chat_quality_label?: string;
  paid_events?: number;
  mix: ChatMix;
  character_label: string;
  top_demands: { text: string; tipo: string; count: number }[];
};

export type ProgramChatInsight = {
  video_id: string;
  title: string;
  channel: string;
  channel_id?: string;
  chat_messages: number;
  msgs_per_1k: number | null;
  noise_score: number | null;
  mix: ChatMix;
  character_label: string;
  top_demands: { text: string; tipo: string; count: number }[];
};

export type ChatInsightsExport = {
  period?: string;
  channels: ChannelChatInsight[];
  top_programs: ProgramChatInsight[];
  demand_signals: ChatDemandSignal[];
  platform_line?: string | null;
  channels_with_chat?: number;
};

const TIPO_LABEL: Record<string, string> = {
  pedido_link: "Pide link / código",
  pregunta_precio: "Consulta precio",
  pregunta_compra: "Dónde comprar",
  pedido_contenido: "Pide contenido / invitado",
  voto_eleccion: "Voto / elección",
  otro: "Demanda de audiencia",
};

export function demandTipoLabel(tipo: string): string {
  return TIPO_LABEL[tipo] || TIPO_LABEL.otro;
}

export function mixSummary(mix: ChatMix | undefined): string {
  if (!mix) return "";
  const parts: string[] = [];
  if ((mix.demanda_pct ?? 0) >= 5) parts.push(`${mix.demanda_pct}% pide algo concreto`);
  if ((mix.obediencia_pct ?? 0) >= 4) parts.push(`${mix.obediencia_pct}% reacciona al conductor`);
  if ((mix.emoji_pct ?? 0) >= 35) parts.push(`${mix.emoji_pct}% emoji`);
  if ((mix.pregunta_pct ?? 0) >= 8) parts.push(`${mix.pregunta_pct}% preguntas`);
  if ((mix.texto_pct ?? 0) >= 25) parts.push(`${mix.texto_pct}% conversación`);
  return parts.slice(0, 3).join(" · ");
}

export function canShowCrossChannelInsights(data: ChatInsightsExport | null | undefined): boolean {
  if (!data?.channels?.length) return false;
  const withChat = data.channels.filter((c) => (c.msgs_per_1k ?? 0) > 0 || c.chat_messages > 0);
  return withChat.length >= 2;
}
