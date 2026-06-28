/**
 * Plan de cuenta agencia — qué pasó + qué hacer el mes que viene.
 * Determinístico sobre corpus exportado (+ brand_history acumulado).
 */

import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import type { ChannelAudienceRow } from "@/lib/agencia-audiencia";
import type { ProgramMapRow } from "@/lib/agencia-mapa";
import type { DondeRubroPack, BrandSlot } from "@/lib/agencia-donde";
import { compact } from "@/lib/format";
import { detectShowFormat } from "@/lib/showFormat";

export type PlanActionKind = "repeat" | "avoid" | "try";

export type PlanAction = {
  kind: PlanActionKind;
  label: string;
  channelName: string;
  program: string;
  detail: string;
  splitPct?: number;
  videoId?: string;
  tSeconds?: number;
};

export type PlanHistoryActivation = {
  date: string;
  channelName: string;
  program: string;
  concAt: number;
  peakPct: number | null;
  isValley: boolean;
  videoId: string;
  tSeconds: number;
  source: "period" | "archive";
};

export type BrandHistoryEntry = {
  name?: string;
  first_seen?: string;
  last_seen?: string;
  activations?: {
    date?: string;
    date_iso?: string;
    channel?: string;
    channel_name?: string;
    title?: string;
    video_id?: string;
    t_seconds?: number;
    conc_at?: number | null;
    program_peak?: number | null;
    retention_pct?: number | null;
    tier_label?: string;
  }[];
  weekly_snapshots?: { exported_at?: string; mentions?: number; value_usd?: number }[];
};

export type BrandHistoryExport = {
  updated_at?: string;
  brands?: Record<string, BrandHistoryEntry>;
};

export type AgenciaPlanPack = {
  brandSlug: string;
  brandName: string;
  rubroLabel: string;
  periodLabel: string;
  exportedAt: string | null;
  trackingSince: string | null;
  trackingUntil: string | null;
  totalActivationsAllTime: number;
  periodActivations: number;
  narrative: string;
  whatsapp: string;
  actions: PlanAction[];
  history: PlanHistoryActivation[];
  historyLine: string;
  hasChatBlindSpot: boolean;
  chatBlindSpotLine: string | null;
};

type AudienceChannel = {
  id: string;
  chat_coverage?: number;
};

type BrandRow = {
  first_seen?: string;
  last_seen?: string;
  n_activations?: number;
  channels?: string[];
};

type MetaSlice = {
  exported_at?: string;
  discovery?: { first_capture?: string; last_capture?: string; period_days?: number };
};

function showLabel(channelId: string, title: string): string {
  if (!title) return "—";
  return detectShowFormat(channelId, title).name;
}

function slotProgram(slot: BrandSlot): string {
  if (slot.channel) {
    const fromTitle = showLabel(slot.channel, slot.program);
    if (fromTitle !== "Otros") return fromTitle;
  }
  return slot.program.slice(0, 48) || "—";
}

function activationKey(videoId: string, tSeconds: number): string {
  return `${videoId}:${tSeconds}`;
}

function historyFromArchive(
  slug: string,
  history: BrandHistoryExport | null | undefined
): PlanHistoryActivation[] {
  const rows = history?.brands?.[slug]?.activations ?? [];
  return rows
    .filter((a) => a.video_id)
    .map((a) => {
      const conc = a.conc_at ?? 0;
      const peak = a.program_peak;
      const peakPct =
        conc && peak && peak > 0 ? Math.round((conc / peak) * 100) : null;
      const channelId = a.channel || "";
      return {
        date: a.date || "",
        channelName: a.channel_name || a.channel || "",
        program: showLabel(channelId, a.title || ""),
        concAt: conc,
        peakPct,
        isValley: peakPct != null && peakPct < 40,
        videoId: a.video_id!,
        tSeconds: a.t_seconds ?? 0,
        source: "archive" as const,
      };
    })
    .sort((a, b) => b.concAt - a.concAt);
}

function mergeHistory(
  slug: string,
  dondePack: DondeRubroPack,
  history: BrandHistoryExport | null | undefined
): PlanHistoryActivation[] {
  const byKey = new Map<string, PlanHistoryActivation>();

  for (const a of historyFromArchive(slug, history)) {
    byKey.set(activationKey(a.videoId, a.tSeconds), a);
  }

  for (const s of dondePack.clientSlots) {
    if (!s.videoId) continue;
    const key = activationKey(s.videoId, s.tSeconds);
    byKey.set(key, {
      date: s.date,
      channelName: s.channelName,
      program: slotProgram(s),
      concAt: s.concAt,
      peakPct: s.peakPct,
      isValley: s.isValley,
      videoId: s.videoId,
      tSeconds: s.tSeconds,
      source: "period",
    });
  }

  return [...byKey.values()].sort(
    (a, b) => b.concAt - a.concAt || a.date.localeCompare(b.date)
  );
}

function findTryOpportunity(
  programs: ProgramMapRow[],
  audience: AudienceChannel[],
  clientChannelIds: string[]
): ProgramMapRow | null {
  const chatChannels = new Set(
    audience.filter((a) => (a.chat_coverage ?? 0) > 0).map((a) => a.id)
  );
  const clientOnlyChatBlind =
    clientChannelIds.length > 0 &&
    clientChannelIds.every((id) => !chatChannels.has(id));

  const ranked = [...programs].sort((a, b) => b.score - a.score || b.peakAttention - a.peakAttention);

  if (clientOnlyChatBlind) {
    const withChat = ranked.find(
      (p) => chatChannels.has(p.channelId) && (p.rubroAbsent || p.pautaMentions <= 2)
    );
    if (withChat) return withChat;
  }

  return ranked.find((p) => p.rubroAbsent || p.gapLabel) ?? ranked[0] ?? null;
}

function scheduleHint(programs: ProgramMapRow[], channelId: string, showId: string): string | null {
  const row = programs.find((p) => p.channelId === channelId && p.showId === showId);
  return row?.peakWindow ?? null;
}

function buildNarrative(
  brandName: string,
  dondePack: DondeRubroPack,
  programs: ProgramMapRow[],
  history: PlanHistoryActivation[],
  historyLine: string,
  tryOpp: ProgramMapRow | null,
  topChannel: ChannelAudienceRow | null,
  hasChatBlindSpot: boolean,
  chatBlindSpotLine: string | null
): string {
  const parts: string[] = [];
  const nPeriod = dondePack.clientSlots.length;
  const repeat = dondePack.repeatSlots[0];
  const avoid = dondePack.avoidSlots[0];

  if (nPeriod === 0) {
    parts.push(
      `${brandName} no tuvo placas verificadas en este período del corpus.`
    );
    if (tryOpp) {
      parts.push(
        `Para arrancar: ${tryOpp.channelName} · ${tryOpp.showName} (${compact(tryOpp.peakAttention)} pico mirando)${tryOpp.peakWindow ? ` — mejor franja ${tryOpp.peakWindow}` : ""}.`
      );
    }
    return parts.join(" ");
  }

  const channels = [...new Set(dondePack.clientSlots.map((s) => s.channelName))];
  parts.push(
    `Esta semana: ${nPeriod} ${nPeriod === 1 ? "placa" : "placas"} en ${channels.join(", ")}.`
  );

  if (history.length > nPeriod && historyLine) {
    parts.push(historyLine);
  }

  if (repeat) {
    const prog = slotProgram(repeat);
    parts.push(
      `La apuesta canal/programa encaja: ${repeat.channelName} · ${prog} (${compact(repeat.concAt)} mirando).`
    );
  }

  if (avoid) {
    const prog = slotProgram(avoid);
    const pct = avoid.peakPct != null ? `${avoid.peakPct}% del pico` : "valle de audiencia";
    parts.push(`No repetir el mismo slot flojo: ${avoid.channelName} · ${prog} (${pct}).`);
    const showId = avoid.channel
      ? detectShowFormat(avoid.channel, avoid.program).id
      : "";
    const win = avoid.channel ? scheduleHint(programs, avoid.channel, showId) : null;
    if (win) parts.push(`Mejor pedir franja ${win}.`);
  } else if (repeat) {
    const showId = repeat.channel
      ? detectShowFormat(repeat.channel, repeat.program).id
      : "";
    const win = repeat.channel ? scheduleHint(programs, repeat.channel, showId) : null;
    if (win) parts.push(`Para la próxima compra, pedir franja ${win}.`);
  }

  if (tryOpp && (!repeat || tryOpp.channelId !== repeat.channel)) {
    parts.push(
      `Probar ${tryOpp.channelName} · ${tryOpp.showName} (${compact(tryOpp.peakAttention)} pico)${tryOpp.peakWindow ? `, franja ${tryOpp.peakWindow}` : ""}${tryOpp.rubroAbsent ? " — poca pauta del rubro ahí" : ""}.`
    );
  }

  if (hasChatBlindSpot && chatBlindSpotLine) {
    parts.push(chatBlindSpotLine);
  }

  if (topChannel && nPeriod > 0) {
    const clientOnTop = dondePack.clientSlots.some(
      (s) => s.channelName.toLowerCase().includes(topChannel.name.toLowerCase().slice(0, 4))
    );
    if (!clientOnTop && topChannel.peakConcurrent > (repeat?.concAt ?? 0) * 1.2) {
      parts.push(
        `Escala del mercado: ${topChannel.name} picó ${compact(topChannel.peakConcurrent)} — evaluar si entra en el mix.`
      );
    }
  }

  return parts.join(" ");
}

export function buildPlanWhatsApp(pack: AgenciaPlanPack): string {
  const lines = [
    `*Plan streaming · ${pack.brandName}*`,
    "",
    pack.narrative,
    "",
  ];

  if (pack.actions.length) {
    lines.push("*Próximos pasos:*");
    for (const a of pack.actions) {
      const split = a.splitPct ? ` (~${a.splitPct}%)` : "";
      lines.push(`• ${a.label}${split}: ${a.channelName} · ${a.program} — ${a.detail}`);
    }
    lines.push("");
  }

  if (pack.history.length > 1) {
    lines.push(`_Histórico: ${pack.totalActivationsAllTime} placas medidas${pack.trackingSince ? ` desde ${pack.trackingSince}` : ""}._`);
    lines.push("");
  }

  lines.push("_ECO · evidencia al segundo · benchmark de exposición, no facturación._");
  return lines.join("\n");
}

export function buildAgenciaPlanPack(input: {
  pair: AgenciaBrandPair;
  brandName: string;
  rubroLabel: string;
  dondePack: DondeRubroPack;
  channelAudience: ChannelAudienceRow[];
  programs: ProgramMapRow[];
  audience: AudienceChannel[];
  brandRow?: BrandRow | null;
  brandHistory?: BrandHistoryExport | null;
  meta?: MetaSlice | null;
}): AgenciaPlanPack {
  const {
    pair,
    brandName,
    rubroLabel,
    dondePack,
    channelAudience,
    programs,
    audience,
    brandRow,
    brandHistory,
    meta,
  } = input;

  const history = mergeHistory(pair.slug, dondePack, brandHistory);
  const histEntry = brandHistory?.brands?.[pair.slug];
  const trackingSince =
    histEntry?.first_seen ?? brandRow?.first_seen ?? null;
  const trackingUntil =
    histEntry?.last_seen ?? brandRow?.last_seen ?? null;
  const totalActivationsAllTime = history.length || brandRow?.n_activations || 0;
  const periodActivations = dondePack.clientSlots.length;

  const periodDays = meta?.discovery?.period_days;
  const captureRange =
    meta?.discovery?.first_capture && meta?.discovery?.last_capture
      ? `${meta.discovery.first_capture} → ${meta.discovery.last_capture}`
      : null;
  const periodLabel = periodDays
    ? `Últimos ${periodDays} días${captureRange ? ` (${captureRange})` : ""}`
    : "Período del corpus";

  const clientChannelIds = brandRow?.channels ?? [];
  const hasChatBlindSpot =
    clientChannelIds.length > 0 &&
    clientChannelIds.every((id) => {
      const row = audience.find((a) => a.id === id);
      return !row || (row.chat_coverage ?? 0) <= 0;
    });

  const tryOpp = findTryOpportunity(programs, audience, clientChannelIds);
  const topChannel = channelAudience[0] ?? null;

  const chatBlindSpotLine = hasChatBlindSpot
    ? tryOpp && (audience.find((a) => a.id === tryOpp.channelId)?.chat_coverage ?? 0) > 0
      ? `Luzu/canales actuales sin chat capturado — ${tryOpp.channelName} sirve para medir reacción de la sala.`
      : "Canales donde pautaron no tienen chat capturado esta semana — no podemos medir la sala ahí."
    : null;

  let historyLine = "";
  if (totalActivationsAllTime > periodActivations) {
    const peak = history[0];
    historyLine = `Histórico: ${totalActivationsAllTime} placas medidas${trackingSince ? ` desde ${trackingSince}` : ""}${peak ? ` · pico ${compact(peak.concAt)} mirando` : ""}.`;
  } else if (totalActivationsAllTime > 0 && trackingSince) {
    historyLine = `Primera medición en corpus: ${trackingSince}${trackingUntil && trackingUntil !== trackingSince ? ` → ${trackingUntil}` : ""}.`;
  }

  const actions: PlanAction[] = [];

  const repeat = dondePack.repeatSlots[0];
  if (repeat) {
    actions.push({
      kind: "repeat",
      label: "Seguir",
      channelName: repeat.channelName,
      program: slotProgram(repeat),
      detail: `${compact(repeat.concAt)} mirando · ${repeat.peakPct ?? "—"}% del pico del programa`,
      splitPct: tryOpp ? 70 : undefined,
      videoId: repeat.videoId,
      tSeconds: repeat.tSeconds,
    });
  }

  const avoid = dondePack.avoidSlots[0];
  if (avoid) {
    actions.push({
      kind: "avoid",
      label: "No repetir",
      channelName: avoid.channelName,
      program: slotProgram(avoid),
      detail: `Solo ${avoid.peakPct ?? "—"}% del pico · pedir otro minuto/franja`,
      videoId: avoid.videoId,
      tSeconds: avoid.tSeconds,
    });
  }

  if (tryOpp && (!repeat || `${tryOpp.channelId}:${tryOpp.showId}` !== `${repeat.channel}:${detectShowFormat(repeat.channel, repeat.program).id}`)) {
    actions.push({
      kind: "try",
      label: "Probar",
      channelName: tryOpp.channelName,
      program: tryOpp.showName,
      detail: `${tryOpp.gapLabel || "Oportunidad"} · pico ${compact(tryOpp.peakAttention)}${tryOpp.peakWindow ? ` · ${tryOpp.peakWindow}` : ""}`,
      splitPct: repeat ? 25 : undefined,
    });
  } else if (dondePack.opportunities[0] && !tryOpp) {
    const o = dondePack.opportunities[0];
    actions.push({
      kind: "try",
      label: "Probar",
      channelName: o.channelName,
      program: o.showName,
      detail: o.gapLabel,
      splitPct: repeat ? 25 : undefined,
    });
  }

  const narrative = buildNarrative(
    brandName,
    dondePack,
    programs,
    history,
    historyLine,
    tryOpp,
    topChannel,
    hasChatBlindSpot,
    chatBlindSpotLine
  );

  const pack: AgenciaPlanPack = {
    brandSlug: pair.slug,
    brandName,
    rubroLabel,
    periodLabel,
    exportedAt: meta?.exported_at ?? brandHistory?.updated_at ?? null,
    trackingSince,
    trackingUntil,
    totalActivationsAllTime,
    periodActivations,
    narrative,
    whatsapp: "",
    actions,
    history,
    historyLine,
    hasChatBlindSpot,
    chatBlindSpotLine,
  };

  pack.whatsapp = buildPlanWhatsApp(pack);
  return pack;
}

/** Resumen corto para ¿Rindió la placa? — sin cargar todo el mercado. */
export function buildAgenciaPlanTeaser(input: {
  brandSlug: string;
  brandName: string;
  periodActivations: number;
  bestConc: number | null;
  valleyCount: number;
  brandHistory?: BrandHistoryExport | null;
}): string | null {
  const { brandSlug, brandName, periodActivations, bestConc, valleyCount, brandHistory } = input;
  const hist = brandHistory?.brands?.[brandSlug];
  const total = hist?.activations?.length ?? periodActivations;
  if (periodActivations === 0 && total === 0) return null;

  const parts: string[] = [];
  if (periodActivations > 0 && bestConc) {
    parts.push(
      `${brandName}: ${periodActivations} ${periodActivations === 1 ? "placa" : "placas"} esta semana · mejor momento ${compact(bestConc)} mirando.`
    );
  }
  if (valleyCount > 0) {
    parts.push(`${valleyCount} ${valleyCount === 1 ? "salió floja" : "salieron flojas"} — ver plan antes de repetir.`);
  }
  if (total > periodActivations && hist?.first_seen) {
    parts.push(`Histórico ECO: ${total} placas desde ${hist.first_seen}.`);
  }
  return parts.join(" ");
}
