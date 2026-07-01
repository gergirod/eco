/** Lógica de grilla de captura — espejo de pipeline/program_schedule.py */

export type CaptureSlot = {
  show: string;
  start: string;
  end: string;
  days: number[];
  days_label: string;
};

export type ChannelSchedule = {
  channel_id: string;
  url?: string;
  capture_enabled?: boolean;
  timezone: string;
  skip_title_patterns: string[];
  capture_slots: CaptureSlot[];
};

export type CaptureSchedulesData = {
  exported_at?: string;
  supervisor: { timezone: string; start: string; end: string };
  channels: ChannelSchedule[];
};

/** Lunes = 0 (como Python weekday). */
export function pyWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function parseHm(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function inSlot(now: Date, slot: CaptureSlot): boolean {
  if (!slot.days.includes(pyWeekday(now))) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseHm(slot.start);
  const end = parseHm(slot.end);
  if (end <= start) return cur >= start || cur < end;
  return cur >= start && cur < end;
}

export function currentSlot(schedule: ChannelSchedule, now: Date): CaptureSlot | null {
  for (const slot of schedule.capture_slots) {
    if (inSlot(now, slot)) return slot;
  }
  return null;
}

export function titleIsFiller(schedule: ChannelSchedule, title: string | null | undefined): boolean {
  if (!title) return false;
  const low = title.toLowerCase();
  return schedule.skip_title_patterns.some((p) => low.includes(p.toLowerCase()));
}

export type CaptureDecision = {
  capture: boolean;
  reason: string;
  slot: CaptureSlot | null;
};

export function shouldCapture(
  schedule: ChannelSchedule,
  now: Date,
  title?: string | null,
): CaptureDecision {
  if (titleIsFiller(schedule, title)) {
    const short = title && title.length > 48 ? `${title.slice(0, 48)}…` : title;
    return { capture: false, reason: `filler: ${short}`, slot: null };
  }
  const slot = currentSlot(schedule, now);
  if (slot) return { capture: true, reason: slot.show, slot };
  return { capture: false, reason: "fuera de franja", slot: null };
}

export function nextSlotToday(
  schedule: ChannelSchedule,
  now: Date,
): { slot: CaptureSlot; at: string } | null {
  const wd = pyWeekday(now);
  const cur = now.getHours() * 60 + now.getMinutes();
  let best: { slot: CaptureSlot; mins: number } | null = null;
  for (const slot of schedule.capture_slots) {
    if (!slot.days.includes(wd)) continue;
    const start = parseHm(slot.start);
    if (start <= cur) continue;
    const delta = start - cur;
    if (!best || delta < best.mins) best = { slot, mins: delta };
  }
  if (!best) return null;
  return { slot: best.slot, at: best.slot.start };
}

export function formatNowAR(timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Hora local de la grilla (ej. Buenos Aires) como Date con esos componentes. */
export function nowInTimezone(timezone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
}
