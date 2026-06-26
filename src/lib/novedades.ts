/**
 * Novedades — eventos detectables desde export JSON (SPEC-008 §7).
 * Sin pipeline ni exports nuevos: solo lectura del bundle actual.
 */

import { formatScopePeriod, isCampaignReport } from "./campaign";

import { buildChatNovedades } from "./chatNovedades";

export type NovedadConfidence = "alta" | "media";

export type NovedadAction =
  | { type: "marca"; slug: string; label: string }
  | { type: "canal"; id: string; label: string }
  | { type: "programa"; channelId: string; videoId: string; label: string }
  | { type: "informe"; campaignSlug: string; label: string };

export type NovedadEvent = {
  id: string;
  date: string;
  dateSort: number;
  headline: string;
  why: string;
  confidence: NovedadConfidence;
  category: "marca" | "programa" | "informe" | "captura" | "chat";
  action: NovedadAction;
};

export type NovedadesOptions = {
  /** Días hacia atrás desde exported_at. Default 7. */
  windowDays?: number;
};

type BrandRow = {
  slug: string;
  name: string;
  kind?: string;
  first_seen?: string;
  last_seen?: string;
  confidence_tier?: string;
  n_activations?: number;
};

type ActivationRow = {
  date?: string;
  date_iso?: string;
  video_id?: string;
  title?: string;
  channel?: string;
  channel_name?: string;
  conc_at?: number | null;
  evidence?: string;
};

const MS_DAY = 86_400_000;

export function parseDisplayDate(value: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return 0;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function parseIsoDate(value: string): number {
  const d = Date.parse(value);
  return Number.isFinite(d) ? d : 0;
}

function refTimestamp(exportedAt: string): number {
  return parseIsoDate(exportedAt) || Date.now();
}

export function isDateInWindow(
  dateStr: string,
  refTs: number,
  windowDays: number
): boolean {
  const d = parseDisplayDate(dateStr);
  if (!d) return false;
  const start = refTs - windowDays * MS_DAY;
  return d >= start && d <= refTs + MS_DAY;
}

function isIsoInWindow(iso: string, refTs: number, windowDays: number): boolean {
  const d = parseIsoDate(iso);
  if (!d) return false;
  const start = refTs - windowDays * MS_DAY;
  return d >= start && d <= refTs + MS_DAY;
}

function isScopeEndInWindow(
  hasta: string | undefined,
  refTs: number,
  windowDays: number
): boolean {
  if (!hasta || hasta.length !== 8) return false;
  const iso = `${hasta.slice(0, 4)}-${hasta.slice(4, 6)}-${hasta.slice(6, 8)}T12:00:00Z`;
  return isIsoInWindow(iso, refTs, windowDays);
}

function activationsInWindow(
  detail: ActivationRow[] | undefined,
  refTs: number,
  windowDays: number
): ActivationRow[] {
  return (detail || []).filter((d) => d.date && isDateInWindow(d.date, refTs, windowDays));
}

export function buildNovedades(
  brands: BrandRow[],
  reports: Record<string, { name: string; kind?: string; detail?: ActivationRow[]; scope?: { hasta?: string; desde?: string; marca?: string }; dataset_generated_at?: string; campaign_slug?: string }>,
  channels: { id: string; name: string; stats?: { last_processed?: string } }[],
  meta: { exported_at?: string },
  options: NovedadesOptions = {},
  moments?: Record<string, { video_id?: string; title?: string; channel?: string; date?: string; has_chat?: boolean; series?: { m: number; chat?: number }[]; audience_demand?: { tema: string; tipo?: string; evidencia?: string }[] }>
): NovedadEvent[] {
  const windowDays = options.windowDays ?? 7;
  const refTs = refTimestamp(meta.exported_at || "");
  const events: NovedadEvent[] = [];
  const seenProgram = new Set<string>();

  for (const b of brands) {
    if (b.kind && b.kind !== "marca") continue;
    if (!b.slug || !b.name || b.confidence_tier === "detected") continue;

    const firstIn = b.first_seen && isDateInWindow(b.first_seen, refTs, windowDays);
    const lastIn = b.last_seen && isDateInWindow(b.last_seen, refTs, windowDays);
    const firstBefore =
      b.first_seen && !isDateInWindow(b.first_seen, refTs, windowDays) && parseDisplayDate(b.first_seen) > 0;

    if (firstIn && b.confidence_tier === "high_confidence") {
      events.push({
        id: `brand-first-high-${b.slug}`,
        date: b.first_seen!,
        dateSort: parseDisplayDate(b.first_seen!),
        headline: `Nueva marca con actividad sólida: ${b.name}`,
        why: "Primera aparición con pauta verificada en el período — vale investigar antes de la competencia.",
        confidence: "alta",
        category: "marca",
        action: { type: "marca", slug: b.slug, label: "Investigar marca" },
      });
    } else if (firstIn && b.confidence_tier === "emerging_confidence") {
      events.push({
        id: `brand-first-emerging-${b.slug}`,
        date: b.first_seen!,
        dateSort: parseDisplayDate(b.first_seen!),
        headline: `Señal temprana: ${b.name}`,
        why: "Marca detectada con respaldo parcial — conviene seguir si el rubro te interesa.",
        confidence: "media",
        category: "marca",
        action: { type: "marca", slug: b.slug, label: "Investigar marca" },
      });
    } else if (firstBefore && lastIn) {
      const report = reports[b.slug];
      const recent = activationsInWindow(report?.detail, refTs, windowDays);
      if (recent.length > 0) {
        const date = b.last_seen || recent[recent.length - 1].date || "";
        events.push({
          id: `brand-return-${b.slug}`,
          date,
          dateSort: parseDisplayDate(date),
          headline: `Nueva actividad de pauta: ${b.name}`,
          why: `${recent.length} aparición${recent.length === 1 ? "" : "es"} en el período — la marca volvió a aparecer en vivo.`,
          confidence: "alta",
          category: "marca",
          action: { type: "marca", slug: b.slug, label: "Investigar marca" },
        });
      }
    }
  }

  for (const [key, report] of Object.entries(reports)) {
    if (!isCampaignReport(report)) continue;
    const slug = report.campaign_slug || key.replace(/^campaign-/, "");
    const generated = report.dataset_generated_at;
    const inWindow =
      (generated && isIsoInWindow(generated, refTs, windowDays)) ||
      isScopeEndInWindow(report.scope?.hasta, refTs, windowDays);

    if (!inWindow) continue;

    const marca = report.scope?.marca || report.name;
    const period =
      report.scope?.desde && report.scope?.hasta
        ? formatScopePeriod(report.scope.desde, report.scope.hasta)
        : "";

    events.push({
      id: `campaign-${slug}`,
      date: report.scope?.hasta
        ? `${report.scope.hasta.slice(6, 8)}/${report.scope.hasta.slice(4, 6)}/${report.scope.hasta.slice(0, 4)}`
        : meta.exported_at?.slice(0, 10).split("-").reverse().join("/") || "—",
      dateSort: report.scope?.hasta
        ? parseDisplayDate(
            `${report.scope.hasta.slice(6, 8)}/${report.scope.hasta.slice(4, 6)}/${report.scope.hasta.slice(0, 4)}`
          )
        : refTs,
      headline: `Informe de entrega publicado: ${marca}`,
      why: period
        ? `Período de pauta ${period} — listo para revisar o compartir con el cliente.`
        : "Nuevo informe de campaña disponible en la plataforma.",
      confidence: "alta",
      category: "informe",
      action: {
        type: "informe",
        campaignSlug: slug,
        label: "Ver informe",
      },
    });
  }

  const programFirstDate = new Map<
    string,
    { date: string; title: string; channel: string; channelName: string; hasLive: boolean }
  >();

  for (const [, report] of Object.entries(reports)) {
    if (report.kind && report.kind !== "marca") continue;
    for (const row of report.detail || []) {
      const vid = row.video_id;
      if (!vid || !row.date) continue;
      const existing = programFirstDate.get(vid);
      const sort = parseDisplayDate(row.date);
      const hasLive = Boolean(row.conc_at && row.conc_at > 0);
      if (!existing || sort < parseDisplayDate(existing.date)) {
        programFirstDate.set(vid, {
          date: row.date,
          title: row.title || vid,
          channel: row.channel || "",
          channelName: row.channel_name || row.channel || "",
          hasLive,
        });
      } else if (existing && hasLive) {
        existing.hasLive = true;
      }
    }
  }

  for (const [vid, prog] of programFirstDate) {
    if (!isDateInWindow(prog.date, refTs, windowDays)) continue;
    if (seenProgram.has(vid)) continue;
    seenProgram.add(vid);

    const shortTitle =
      prog.title.length > 72 ? `${prog.title.slice(0, 69).trimEnd()}…` : prog.title;

    events.push({
      id: `program-${vid}`,
      date: prog.date,
      dateSort: parseDisplayDate(prog.date),
      headline: prog.hasLive
        ? `Nuevo programa con captura live: ${shortTitle}`
        : `Nuevo programa procesado: ${shortTitle}`,
      why: prog.hasLive
        ? `Emitido en ${prog.channelName} con concurrentes medidos al minuto — evidencia verificable.`
        : `Primera emisión de este programa en el corpus capturado.`,
      confidence: prog.hasLive ? "alta" : "media",
      category: "programa",
      action: {
        type: "programa",
        channelId: prog.channel,
        videoId: vid,
        label: "Ver programa",
      },
    });
  }

  for (const ch of channels) {
    const lp = ch.stats?.last_processed;
    if (!lp || !isDateInWindow(lp, refTs, windowDays)) continue;
    events.push({
      id: `capture-${ch.id}-${lp.replace(/\//g, "")}`,
      date: lp,
      dateSort: parseDisplayDate(lp),
      headline: `Captura actualizada en ${ch.name}`,
      why: "Nuevas emisiones incorporadas al corpus — revisá marcas y programas del canal.",
      confidence: "media",
      category: "captura",
      action: { type: "canal", id: ch.id, label: "Ver canal" },
    });
  }

  events.sort((a, b) => b.dateSort - a.dateSort);

  if (moments) {
    const chatEvents = buildChatNovedades(moments, reports, refTs, windowDays);
    events.push(...chatEvents);
    events.sort((a, b) => b.dateSort - a.dateSort);
  }

  return events;
}

export function novedadesCoverageLine(
  events: NovedadEvent[],
  windowDays: number,
  exportedAt: string
): string {
  const ref = exportedAt
    ? new Date(exportedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
    : "—";
  return `${events.length} evento${events.length === 1 ? "" : "s"} en los últimos ${windowDays} días · datos al ${ref}`;
}
