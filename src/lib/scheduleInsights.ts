/**
 * Horario óptimo — cuándo arranca cada show y en qué franja pega más fuerte.
 */

export type ScheduleHourSlot = {
  hour: number;
  label: string;
  avg_peak: number;
  n: number;
};

export type ScheduleWeekdaySlot = {
  weekday: number;
  label: string;
  avg_peak: number;
  n: number;
};

export type ShowScheduleInsight = {
  channel_id: string;
  show_id: string;
  show_name: string;
  emissions: number;
  typical_start: string;
  peak_window: string;
  best_weekday: string;
  avg_peak: number;
  line: string;
};

export type ScheduleInsightsExport = {
  period?: string;
  programs_analyzed?: number;
  platform_line?: string | null;
  best_hours?: ScheduleHourSlot[];
  best_weekdays?: ScheduleWeekdaySlot[];
  shows?: ShowScheduleInsight[];
};

export function applyRubroToSchedule(
  data: ScheduleInsightsExport,
  allowedChannelIds: Set<string> | null
): ScheduleInsightsExport {
  if (!allowedChannelIds?.size || !data.shows) return data;
  const shows = data.shows.filter((s) => allowedChannelIds.has(s.channel_id));
  if (!shows.length) {
    return { ...data, shows: [], platform_line: null, best_hours: [], best_weekdays: [] };
  }
  return { ...data, shows };
}

export function canShowScheduleInsights(data: ScheduleInsightsExport | null | undefined): boolean {
  return Boolean(data?.programs_analyzed && data.programs_analyzed >= 3 && data.shows?.length);
}
