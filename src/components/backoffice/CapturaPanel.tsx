"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Stat } from "@/components/ui";
import { useCorpus } from "@/lib/useCorpus";
import {
  type CaptureSchedulesData,
  type ChannelSchedule,
  formatNowAR,
  nowInTimezone,
  shouldCapture,
  nextSlotToday,
} from "@/lib/captureSchedule";

type LiveRow = { id: string; name: string; live: boolean | null; title?: string };

const DAY_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function slotGrid(schedule: ChannelSchedule): boolean[][] {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(false));
  for (const slot of schedule.capture_slots) {
    const sh = parseInt(slot.start.split(":")[0], 10);
    const eh = parseInt(slot.end.split(":")[0], 10);
    const em = parseInt(slot.end.split(":")[1], 10);
    let hEnd = eh + (em > 0 ? 1 : 0);
    if (hEnd <= sh && eh < sh) hEnd = 24;
    for (const d of slot.days) {
      for (let h = sh; h < Math.min(hEnd, 24); h++) grid[d][h] = true;
    }
  }
  return grid;
}

function ChannelGrilla({ schedule }: { schedule: ChannelSchedule }) {
  const grid = useMemo(() => slotGrid(schedule), [schedule]);
  const hasAny = grid.some((row) => row.some(Boolean));
  if (!hasAny) {
    return <p className="text-[12px] text-gray-400">Sin franjas configuradas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            <th className="text-left py-1 pr-2 text-gray-400 font-normal w-10" />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="text-center text-gray-300 font-normal px-0" style={{ minWidth: 14 }}>
                {h % 6 === 0 ? h : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_SHORT.map((label, d) => (
            <tr key={label}>
              <td className="text-gray-500 pr-2 py-0.5">{label}</td>
              {grid[d].map((on, h) => (
                <td key={h} className="p-0">
                  <div
                    className={`h-3 mx-px rounded-sm ${on ? "bg-accent/70" : "bg-gray-100"}`}
                    title={on ? `${label} ${h}:00` : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-3 space-y-1">
        {schedule.capture_slots.map((s, i) => (
          <li key={i} className="text-[12px] text-gray-600">
            <span className="font-medium text-gray-800">{s.show}</span>
            <span className="text-gray-400"> · {s.days_label} · {s.start}–{s.end}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CapturaPanel() {
  const { capture_schedules: schedules, channels } = useCorpus([
    "capture_schedules",
    "channels",
  ] as const);
  const tz = (schedules as CaptureSchedulesData).supervisor?.timezone || "America/Argentina/Buenos_Aires";

  const [live, setLive] = useState<LiveRow[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refreshLive = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      const data = await res.json();
      setLive(data.channels || []);
      setCheckedAt(new Date(data.checked_at).toLocaleTimeString("es-AR"));
    } catch {
      setCheckedAt("error");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshLive();
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [refreshLive]);

  const nowAR = useMemo(() => {
    void tick;
    return nowInTimezone(tz);
  }, [tz, tick]);

  const scheduleById = useMemo(() => {
    const m = new Map<string, ChannelSchedule>();
    const data = schedules as CaptureSchedulesData;
    for (const s of data.channels || []) m.set(s.channel_id, s);
    return m;
  }, [schedules]);

  const liveMap = useMemo(() => {
    const m = new Map<string, LiveRow>();
    for (const r of live) m.set(r.id, r);
    return m;
  }, [live]);

  const channelMeta = useMemo(() => {
    const m = new Map<string, { id: string; name: string; enabled?: boolean; url?: string }>();
    for (const c of channels as any[]) m.set(c.id, c);
    return m;
  }, [channels]);

  const rows = useMemo(() => {
    const data = schedules as CaptureSchedulesData;
    return (data.channels || []).map((sched) => {
      const meta = channelMeta.get(sched.channel_id);
      const channel = {
        id: sched.channel_id,
        name: meta?.name || sched.channel_id,
        enabled: meta?.enabled ?? sched.capture_enabled ?? true,
        url: sched.url || meta?.url,
      };
      const lv = liveMap.get(sched.channel_id);
      const dec = shouldCapture(sched, nowAR, lv?.title);
      const next = dec.capture ? null : nextSlotToday(sched, nowAR);
      let status: "capturando" | "esperando" | "filler" | "off" | "idle" = "idle";
      if (lv?.live === true && dec.capture) status = "capturando";
      else if (lv?.live === true && dec.reason.startsWith("filler")) status = "filler";
      else if (lv?.live === true) status = "esperando";
      else if (lv?.live === false) status = "off";
      return { channel, sched, lv, dec, next, status };
    });
  }, [schedules, channelMeta, liveMap, nowAR]);

  const capturing = rows.filter((r) => r.status === "capturando").length;
  const inWindow = rows.filter((r) => r.dec.capture).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[13px] text-gray-600">
            Hora grilla: <strong>{formatNowAR(tz)}</strong> ({tz.replace("America/Argentina/", "")})
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Supervisor {(schedules as CaptureSchedulesData).supervisor?.start}–
            {(schedules as CaptureSchedulesData).supervisor?.end} · poll cada ~30s
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={refreshLive} disabled={checking}>
          {checking ? "Chequeando…" : "↻ YouTube en vivo"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="En franja ahora" value={inWindow} hint="programas con grilla activa" />
        <Stat label="Capturando" value={capturing} hint="vivo + grilla OK" />
        <Stat label="Canales" value={rows.length} hint="en config/schedules/*.yaml" />
        <Stat label="Chequeo YT" value={checkedAt || "—"} hint="último poll" />
      </div>

      <div className="card overflow-hidden mb-6">
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th>YouTube</th>
              <th>Grilla</th>
              <th>Decisión</th>
              <th>Programa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ channel, lv, dec, next, status }) => (
              <tr
                key={channel.id}
                className="cursor-pointer hover:bg-gray-50/80"
                onClick={() => setExpanded(expanded === channel.id ? null : channel.id)}
              >
                <td>
                  <div className="font-medium">{channel.name}</div>
                  <div className="text-[11px] text-gray-400">{channel.id}</div>
                </td>
                <td>
                  {lv?.live === true ? (
                    <Badge tone="green">● vivo</Badge>
                  ) : lv?.live === false ? (
                    <Badge tone="gray">offline</Badge>
                  ) : checkedAt ? (
                    <Badge tone="amber">s/d</Badge>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td>
                  {dec.capture ? (
                    <Badge tone="blue">franja activa</Badge>
                  ) : next ? (
                    <span className="text-[12px] text-gray-500">próx. {next.at}</span>
                  ) : (
                    <Badge tone="gray">sin franja hoy</Badge>
                  )}
                </td>
                <td>
                  {status === "capturando" && <Badge tone="green">capturar</Badge>}
                  {status === "filler" && <Badge tone="amber">skip filler</Badge>}
                  {status === "esperando" && <Badge tone="amber">vivo, fuera</Badge>}
                  {status === "off" && <Badge tone="gray">sin live</Badge>}
                  {status === "idle" && <span className="text-gray-300 text-[12px]">—</span>}
                </td>
                <td className="text-[12px] text-gray-600 max-w-[240px] truncate" title={lv?.title}>
                  {dec.capture ? dec.reason : lv?.title?.slice(0, 60) || dec.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 px-4 py-2 border-t border-[#ececec]">
          Clic en una fila para ver la grilla semanal. La captura real corre en la Mac (supervisor); esto es
          espejo de <code className="text-[10px]">config/schedules/*.yaml</code>.
        </p>
      </div>

      {expanded && scheduleById.has(expanded) && (
        <div className="card p-5">
          <h3 className="text-[15px] font-semibold mb-1">
            {channelMeta.get(expanded)?.name || expanded}
          </h3>
          <p className="text-[12px] text-gray-400 mb-4">Franjas que el supervisor captura (hora Argentina)</p>
          <ChannelGrilla schedule={scheduleById.get(expanded)!} />
        </div>
      )}
    </div>
  );
}
