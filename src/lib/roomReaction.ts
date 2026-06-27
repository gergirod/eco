/** Participación en sala — encuestas, mensajes fijados, apoyo (room_intel). */

export type RoomReaction = {
  has_data?: boolean;
  cobertura?: boolean;
  in_window?: boolean;
  table_line?: string;
  headline?: string;
  detail_lines?: string[];
  lines?: string[];
  pins?: { text?: string; duration_s?: number; ts_start_s?: number; pinned_by?: string }[];
  polls?: {
    question?: string;
    total_votes?: number;
    ts_s?: number;
    winner?: string | null;
    winner_pct?: string | null;
  }[];
  monetization?: { paid_events?: number; total_by_currency?: Record<string, number> } | null;
  disclaimer?: string | null;
};

export type RoomParticipation = {
  has_data?: boolean;
  poll_count?: number;
  total_votes?: number;
  banner_sessions?: number;
  paid_events?: number;
  chat_messages?: number;
  total_by_currency?: Record<string, number>;
  summary_line?: string | null;
  participation_line?: string | null;
  highlights?: {
    kind: "encuesta" | "mensaje_fijado" | "super_chat";
    question?: string;
    text?: string;
    author?: string;
    amount_display?: string;
    total_votes?: number;
    duration_s?: number;
    minute?: number;
    winner?: string | null;
    winner_pct?: string | null;
    pinned_by?: string;
  }[];
};

export type RoomRow = {
  room_reaction?: RoomReaction | null;
};

export function getRoomReaction(row: RoomRow): RoomReaction | null {
  const rx = row.room_reaction;
  if (!rx?.has_data && !rx?.in_window && !rx?.headline && !rx?.table_line) {
    return null;
  }
  return rx;
}

export function roomHasSignal(row: RoomRow): boolean {
  const rx = getRoomReaction(row);
  if (!rx) return false;
  if (rx.in_window && (rx.lines?.length || rx.headline)) return true;
  if ((rx.monetization?.paid_events ?? 0) > 0) return true;
  return false;
}

export function roomHeadline(row: RoomRow): string {
  const rx = getRoomReaction(row);
  if (!rx) return "";
  if (rx.headline) return rx.headline;
  return (rx.lines || []).join(" ");
}

export function roomTableLine(row: RoomRow): string {
  const rx = getRoomReaction(row);
  if (!rx) return "";
  if (rx.in_window && rx.table_line) return rx.table_line;
  if (rx.has_data && !rx.in_window) return "Sin participación en este tramo";
  return "";
}

export function fmtVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

export function fmtDuration(secs: number | undefined): string {
  if (secs == null) return "?";
  const s = Math.max(0, Math.round(secs));
  if (s >= 120) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r < 20 ? `${m} min` : `${m} min ${r} s`;
  }
  if (s >= 60) return "1 min";
  return `${s} s`;
}

export function highlightLabel(h: NonNullable<RoomParticipation["highlights"]>[number]): string {
  if (h.kind === "super_chat") {
    const amt = h.amount_display ? `${h.amount_display} · ` : "";
    const who = h.author && h.author !== "?" ? `${h.author}: ` : "";
    const t = h.text || "super chat";
    return `${amt}${who}${t}`;
  }
  if (h.kind === "encuesta") {
    const v = h.total_votes ? `${fmtVotes(h.total_votes)} votos` : "encuesta";
    const q = h.question ? `«${h.question.slice(0, 56)}${(h.question.length || 0) > 56 ? "…" : ""}»` : "";
    return q ? `${v} — ${q}` : v;
  }
  const dur = fmtDuration(h.duration_s);
  const t = h.text ? `«${h.text.slice(0, 50)}${(h.text.length || 0) > 50 ? "…" : ""}»` : "mensaje del canal";
  return `Visible ${dur}: ${t}`;
}
