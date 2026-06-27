/**
 * Eventos de chat para Novedades (SPEC-009 F3).
 * Lee moments + reports del export actual — sin pipeline adicional.
 */

import type { NovedadEvent } from "./novedades";
import { isDateInWindow, parseDisplayDate } from "./novedades";
import { CHAT_DISCLAIMER } from "./evidenceLane";

type MomentRow = {
  video_id?: string;
  title?: string;
  channel?: string;
  date?: string;
  has_chat?: boolean;
  series?: { m: number; chat?: number }[];
  audience_demand?: { tema: string; tipo?: string; evidencia?: string; n?: number }[];
  room_participation?: {
    has_data?: boolean;
    highlights?: {
      kind: string;
      question?: string;
      text?: string;
      total_votes?: number;
      duration_s?: number;
      minute?: number;
    }[];
  };
};

type ActivationRow = {
  date?: string;
  video_id?: string;
  title?: string;
  channel?: string;
  channel_name?: string;
  brand_name?: string;
  t_seconds?: number;
  chat_reaction?: {
    eco_marca_post?: number;
    eco_line?: string;
    cobertura?: boolean;
    chat_ratio?: number | null;
    spike_rpm?: number | null;
  };
};

const STRONG_DEMAND = new Set(["pedido_link", "pregunta_precio", "pregunta_compra"]);

function shortTitle(title: string, max = 64): string {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}

function fmtClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}` : `${m} min`;
}

function formatVotes(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

function fmtPinDuration(secs: number): string {
  const m = Math.round(secs / 60);
  return m >= 1 ? `${m} min` : `${Math.round(secs)} s`;
}

function detectChatPeak(mo: MomentRow): { minute: number; spike: number; peak: number } | null {
  if (!mo.has_chat || !mo.series?.length) return null;
  const chats = mo.series.map((s) => s.chat || 0);
  const nonzero = chats.filter((c) => c > 0);
  if (nonzero.length < 15) return null;
  const avg = nonzero.reduce((a, b) => a + b, 0) / nonzero.length;
  if (avg < 8) return null;
  let peak = 0;
  let peakMin = 0;
  for (const s of mo.series) {
    const c = s.chat || 0;
    if (c > peak) {
      peak = c;
      peakMin = s.m;
    }
  }
  if (peak < 2.5 * avg || peak < 25) return null;
  return { minute: peakMin, spike: Math.round((peak / avg) * 10) / 10, peak };
}

export function buildChatNovedades(
  moments: Record<string, MomentRow>,
  reports: Record<string, { name: string; kind?: string; detail?: ActivationRow[] }>,
  refTs: number,
  windowDays: number
): NovedadEvent[] {
  const events: NovedadEvent[] = [];
  const seenPeak = new Set<string>();
  const seenDemand = new Set<string>();
  const seenCommentary = new Set<string>();
  const vidToChannel: Record<string, string> = {};
  for (const report of Object.values(reports)) {
    if (report.kind && report.kind !== "marca") continue;
    for (const row of report.detail || []) {
      if (row.video_id && row.channel) vidToChannel[row.video_id] = row.channel;
    }
  }

  for (const [vid, mo] of Object.entries(moments)) {
    if (!mo.date || !isDateInWindow(mo.date, refTs, windowDays)) continue;

    const peak = detectChatPeak(mo);
    if (peak && !seenPeak.has(vid)) {
      seenPeak.add(vid);
      const title = shortTitle(mo.title || vid);
      const channelId = vidToChannel[vid] || (mo.channel || "").toLowerCase();
      events.push({
        id: `chat-peak-${vid}`,
        date: mo.date,
        dateSort: parseDisplayDate(mo.date),
        headline: `Chat muy activo en ${title}`,
        why: `Pico de ${peak.peak} msgs/min (~${peak.spike}× el ritmo habitual) en el min ${fmtClock(peak.minute)} — momento de atención espontánea en la sala.`,
        confidence: "media",
        category: "chat",
        action: {
          type: "programa",
          channelId,
          videoId: vid,
          label: "Ver programa",
        },
      });
    }

    const strong = (mo.audience_demand || []).filter((d) => d.tipo && STRONG_DEMAND.has(d.tipo));
    if (strong.length && !seenDemand.has(vid)) {
      seenDemand.add(vid);
      const top = strong[0];
      const title = shortTitle(mo.title || vid);
      const channelId = vidToChannel[vid] || (mo.channel || "").toLowerCase();
      events.push({
        id: `chat-demand-${vid}`,
        date: mo.date,
        dateSort: parseDisplayDate(mo.date),
        headline: `Demanda en el chat: ${top.tema}`,
        why: `La audiencia pidió algo concreto en ${title} — “${(top.evidencia || "").slice(0, 90)}${(top.evidencia?.length || 0) > 90 ? "…" : ""}”.`,
        confidence: "media",
        category: "chat",
        action: {
          type: "programa",
          channelId,
          videoId: vid,
          label: "Ver demanda",
        },
      });
    }

    const commentary = (mo.audience_demand || []).filter(
      (d) => d.tema && (!d.tipo || !STRONG_DEMAND.has(d.tipo))
    );
    if (commentary.length && !seenCommentary.has(vid)) {
      seenCommentary.add(vid);
      const top = commentary.sort((a, b) => (b.n || 1) - (a.n || 1))[0];
      const title = shortTitle(mo.title || vid);
      const channelId = vidToChannel[vid] || (mo.channel || "").toLowerCase();
      events.push({
        id: `chat-comment-${vid}`,
        date: mo.date,
        dateSort: parseDisplayDate(mo.date),
        headline: `La sala comentó: ${top.tema}`,
        why: `Mensajes en chat en ${title} — “${(top.evidencia || "").slice(0, 90)}${(top.evidencia?.length || 0) > 90 ? "…" : ""}”. ${CHAT_DISCLAIMER}`,
        confidence: "baja",
        category: "chat",
        action: {
          type: "programa",
          channelId,
          videoId: vid,
          label: "Ver programa",
        },
      });
    }
  }

  for (const [vid, mo] of Object.entries(moments)) {
    if (!mo.date || !isDateInWindow(mo.date, refTs, windowDays)) continue;
    const rp = mo.room_participation;
    if (!rp?.has_data || !rp.highlights?.length) continue;
    const channelId = vidToChannel[vid] || (mo.channel || "").toLowerCase();
    const title = shortTitle(mo.title || vid);

    for (const h of rp.highlights.slice(0, 2)) {
      if (h.kind === "encuesta" && (h.total_votes || 0) >= 2000) {
        events.push({
          id: `room-poll-${vid}-${h.minute ?? h.total_votes}`,
          date: mo.date,
          dateSort: parseDisplayDate(mo.date),
          headline: `Encuesta con ${formatVotes(h.total_votes || 0)} votos — ${title}`,
          why: h.question
            ? `La audiencia votó en vivo: «${h.question.slice(0, 80)}${(h.question.length || 0) > 80 ? "…" : ""}».`
            : `Participación masiva en encuesta nativa del programa.`,
          confidence: "media",
          category: "chat",
          action: {
            type: "programa",
            channelId,
            videoId: vid,
            label: "Ver programa",
          },
        });
      }
      if (h.kind === "mensaje_fijado" && (h.duration_s || 0) >= 120) {
        events.push({
          id: `room-pin-${vid}-${h.minute ?? h.duration_s}`,
          date: mo.date,
          dateSort: parseDisplayDate(mo.date),
          headline: `Mensaje fijado ${fmtPinDuration(h.duration_s || 0)} — ${title}`,
          why: h.text
            ? `El canal dejó visible arriba del chat: «${h.text.slice(0, 90)}${(h.text.length || 0) > 90 ? "…" : ""}».`
            : `Mensaje pinneado visible ${fmtPinDuration(h.duration_s || 0)} en el chat en vivo.`,
          confidence: "media",
          category: "chat",
          action: {
            type: "programa",
            channelId,
            videoId: vid,
            label: "Ver programa",
          },
        });
      }
    }
  }

  for (const [slug, report] of Object.entries(reports)) {
    if (report.kind && report.kind !== "marca") continue;
    for (const row of report.detail || []) {
      const eco = row.chat_reaction?.eco_marca_post ?? 0;
      if (eco < 2 || !row.date || !isDateInWindow(row.date, refTs, windowDays)) continue;
      const vid = row.video_id || "";
      const ts = row.t_seconds ?? 0;
      const id = `chat-eco-${slug}-${vid}-${ts}`;
      const brand = row.brand_name || report.name;
      events.push({
        id,
        date: row.date,
        dateSort: parseDisplayDate(row.date),
        headline: `La audiencia repitió ${brand} en el chat`,
        why:
          row.chat_reaction?.eco_line ||
          `${eco} mensajes mencionaron la marca tras la aparición — eco de comunidad, no certifica pauta.`,
        confidence: "media",
        category: "chat",
        action: {
          type: "marca",
          slug,
          label: "Ver aparición",
        },
      });
    }
  }

  return events;
}
