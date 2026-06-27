/** KPI de captura en vivo — export en meta.live_capture (pipeline/viewers.py). */

import { formatHours } from "./coverage";

export type LiveCaptureChannel = {
  id: string;
  streams: number;
  hours: number;
  first_capture?: string;
  last_capture?: string;
};

export type LiveCaptureShow = {
  channel_id: string;
  show_id: string;
  show_name: string;
  streams: number;
  hours: number;
};

export type LiveCaptureStats = {
  hours_captured: number;
  streams_captured: number;
  channels_captured: number;
  capture_days: number;
  first_capture: string;
  last_capture: string;
  by_channel?: LiveCaptureChannel[];
  by_show?: LiveCaptureShow[];
};

export function getLiveCapture(meta: { live_capture?: LiveCaptureStats } | null | undefined) {
  return meta?.live_capture ?? null;
}

export function getChannelCaptureHours(
  liveCapture: LiveCaptureStats | null | undefined,
  channelId: string
): LiveCaptureChannel | null {
  if (!liveCapture?.by_channel?.length) return null;
  return liveCapture.by_channel.find((c) => c.id === channelId) ?? null;
}

export function getShowCapturesForChannel(
  liveCapture: LiveCaptureStats | null | undefined,
  channelId: string
): LiveCaptureShow[] {
  if (!liveCapture?.by_show?.length) return [];
  return liveCapture.by_show
    .filter((s) => s.channel_id === channelId)
    .sort((a, b) => b.hours - a.hours || b.streams - a.streams);
}

export function getShowCaptureHours(
  liveCapture: LiveCaptureStats | null | undefined,
  channelId: string,
  showId: string
): LiveCaptureShow | null {
  if (!liveCapture?.by_show?.length) return null;
  return (
    liveCapture.by_show.find((s) => s.channel_id === channelId && s.show_id === showId) ?? null
  );
}

export function formatCaptureHoursLine(row: { hours: number; streams: number } | null | undefined) {
  if (!row || row.hours <= 0) return null;
  const streams =
    row.streams === 1 ? "1 emisión en vivo" : `${row.streams} emisiones en vivo`;
  return `${formatHours(row.hours)} track · ${streams}`;
}
