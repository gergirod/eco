/** Chat en la pauta — copy y tono (SPEC-009 F1). */

export type ChatReaction = {
  cobertura?: boolean;
  has_chat?: boolean;
  chat_ratio?: number | null;
  spike_rpm?: number | null;
  pre_rpm?: number | null;
  post_rpm?: number | null;
  eco_marca_post?: number;
  eco_line?: string | null;
  demanda_post?: number;
  tone?: "up" | "neutral" | "down" | "none";
  table_line?: string;
  headline?: string;
  detail_lines?: string[];
  ejemplos?: string[];
  motivo?: string | null;
};

export type ChatRow = {
  chat_reaction?: ChatReaction | null;
  chat_ratio?: number | null;
  has_chat?: boolean;
};

const TONE_CLASS: Record<string, string> = {
  up: "text-green-800",
  neutral: "text-gray-600",
  down: "text-amber-800",
  none: "text-gray-400",
};

export function getChatReaction(row: ChatRow): ChatReaction {
  if (row.chat_reaction && (row.chat_reaction.table_line || row.chat_reaction.headline)) {
    return row.chat_reaction;
  }
  return fallbackChatReaction(row);
}

function fallbackChatReaction(row: ChatRow): ChatReaction {
  if (row.has_chat === false) {
    return {
      has_chat: false,
      cobertura: false,
      tone: "none",
      table_line: "Sin chat capturado",
      headline: "No hay chat capturado para este programa.",
    };
  }
  const r = row.chat_ratio;
  if (r == null) {
    return {
      has_chat: true,
      cobertura: false,
      tone: "none",
      table_line: "Sin baseline de chat",
      headline: "Hay chat en el programa pero no hay comparación para este tramo.",
    };
  }
  let table_line: string;
  let tone: ChatReaction["tone"];
  if (r >= 1.5) {
    table_line = `Chat ${fmtMult(r)} más activo que el promedio del programa`;
    tone = "up";
  } else if (r >= 1.15) {
    table_line = `Chat ~${Math.round((r - 1) * 100)}% por encima del ritmo habitual`;
    tone = "up";
  } else if (r >= 0.85) {
    table_line = "Chat en línea con el promedio del programa";
    tone = "neutral";
  } else {
    table_line = `Chat más quieto que el resto del programa (~${Math.round((1 - r) * 100)}%)`;
    tone = "down";
  }
  return { has_chat: true, cobertura: true, chat_ratio: r, table_line, tone };
}

function fmtMult(r: number): string {
  const s = r.toFixed(1).replace(".0", "");
  return `${s}×`;
}

export function chatTableLine(row: ChatRow): string {
  return getChatReaction(row).table_line || "—";
}

export function chatHeadline(row: ChatRow): string {
  return getChatReaction(row).headline || getChatReaction(row).table_line || "—";
}

export function chatToneClass(row: ChatRow): string {
  const tone = getChatReaction(row).tone || "none";
  return TONE_CLASS[tone] || TONE_CLASS.none;
}

export function chatEcoLine(row: ChatRow): string | null {
  const cr = getChatReaction(row).eco_line;
  if (cr) return cr;
  const rx = row.chat_reaction;
  if (rx?.eco_line) return rx.eco_line;
  const n = rx?.eco_marca_post;
  if (n && n >= 2) return `${n} mensajes repitieron la marca en el chat tras la aparición`;
  if (n === 1) return "1 mensaje mencionó la marca en el chat tras la aparición";
  return null;
}

export function chatToneDot(row: ChatRow): string {
  const tone = getChatReaction(row).tone || "none";
  if (tone === "up") return "bg-green-500";
  if (tone === "down") return "bg-amber-500";
  if (tone === "neutral") return "bg-gray-400";
  return "bg-gray-300";
}
