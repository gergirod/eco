"use client";
import { useState } from "react";
import { PageHeader, Badge, Stat } from "@/components/ui";
import OpsLogout from "@/components/OpsLogout";
import { compact, num } from "@/lib/format";
import { useDataset } from "@/lib/useDataset";
import channelsFb from "@/data/channels.json";

type LiveMap = Record<string, boolean | null>;

const STEPS = ["ingest", "transcribe", "extract", "brand_monitor", "report"];

export default function Backoffice() {
  const channels = useDataset<any[]>("channels", channelsFb);
  const [selected, setSelected] = useState<string[]>(
    channelsFb.filter((c: any) => c.enabled).map((c: any) => c.id)
  );
  const [live, setLive] = useState<LiveMap>({});
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string>("");
  const [run, setRun] = useState<{ running: boolean; step: number; channels: string[] }>({
    running: false,
    step: 0,
    channels: [],
  });

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function refreshLive() {
    setChecking(true);
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      const data = await res.json();
      const map: LiveMap = {};
      data.channels.forEach((c: any) => (map[c.id] = c.live));
      setLive(map);
      setCheckedAt(new Date(data.checked_at).toLocaleTimeString("es-AR"));
    } catch {
      setCheckedAt("error de chequeo");
    } finally {
      setChecking(false);
    }
  }

  function startRun() {
    if (!selected.length || run.running) return;
    setRun({ running: true, step: 0, channels: selected });
    // Simulación visual del avance del run (la ejecución real corre local: IP residencial + Modal GPU).
    let step = 0;
    const t = setInterval(() => {
      step++;
      if (step >= STEPS.length) {
        clearInterval(t);
        setRun((r) => ({ ...r, running: false, step: STEPS.length }));
      } else {
        setRun((r) => ({ ...r, step }));
      }
    }, 1100);
  }

  const liveCount = Object.values(live).filter((v) => v === true).length;
  const withData = channels.filter((c: any) => c.has_data).length;

  return (
    <div>
      <div className="flex justify-end mb-1">
        <OpsLogout />
      </div>
      <PageHeader title="Backoffice · Runs" sub="Vista interna: elegí canales, dispará el run y mirá el estado del proceso." />

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Seleccionados" value={selected.length} hint="para el próximo run" />
        <Stat label="Con data" value={withData} hint="ya procesados" />
        <Stat label="En vivo ahora" value={checkedAt ? liveCount : "—"} hint={checkedAt ? `chequeado ${checkedAt}` : "sin chequear"} />
        <Stat label="Universo" value={channels.length} hint="canales AR" />
      </div>

      {/* Panel de run */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold">Arrancar run</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Pipeline: {STEPS.join(" → ")}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={refreshLive} disabled={checking}>
              {checking ? "Chequeando…" : "↻ Estado en vivo"}
            </button>
            <button className="btn btn-primary" onClick={startRun} disabled={!selected.length || run.running}>
              {run.running ? "Corriendo…" : `▶ Run (${selected.length} canales)`}
            </button>
          </div>
        </div>

        {run.channels.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${
                      i < run.step
                        ? "bg-green-50 text-green-700"
                        : i === run.step && run.running
                        ? "bg-accent-soft text-accent"
                        : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {i < run.step ? "✓ " : ""}
                    {s}
                  </span>
                  {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-gray-400">
              {run.running
                ? `Procesando ${run.channels.length} canales…`
                : run.step >= STEPS.length
                ? "Run completado (simulado en demo)."
                : ""}
            </p>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          Nota: la ejecución real del pipeline corre <strong>local</strong> (ingest desde IP residencial + transcripción
          en Modal GPU); no puede correr dentro de Vercel. Este panel dispara la orden y refleja el avance. El chequeo de
          “en vivo” sí es real y on-demand.
        </p>
      </div>

      {/* Tabla de canales */}
      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Canal</th>
              <th>Género</th>
              <th>En vivo</th>
              <th>Estado proceso</th>
              <th className="text-right">VODs</th>
              <th className="text-right">Audiencia media</th>
              <th className="text-right">Anunciantes</th>
              <th>Último</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c: any) => {
              const lv = live[c.id];
              return (
                <tr key={c.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggle(c.id)}
                      className="accent-accent w-4 h-4"
                    />
                  </td>
                  <td>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-gray-400">{c.subscribers} subs {c.handle_verified ? "" : "· handle a verificar"}</div>
                  </td>
                  <td className="text-gray-500">{c.genre}</td>
                  <td>
                    {lv === true ? (
                      <Badge tone="green">● en vivo</Badge>
                    ) : lv === false ? (
                      <Badge tone="gray">offline</Badge>
                    ) : lv === null && checkedAt ? (
                      <Badge tone="amber">s/d</Badge>
                    ) : (
                      <span className="text-gray-300 text-[12px]">—</span>
                    )}
                  </td>
                  <td>
                    {c.pipeline_status === "activo" ? (
                      <Badge tone="blue">activo</Badge>
                    ) : c.pipeline_status === "configurado" ? (
                      <Badge tone="gray">configurado</Badge>
                    ) : (
                      <Badge tone="gray">disponible</Badge>
                    )}
                  </td>
                  <td className="text-right tabular-nums">{c.stats ? c.stats.videos_processed : "—"}</td>
                  <td className="text-right tabular-nums">{c.stats?.avg_concurrent ? compact(c.stats.avg_concurrent) : "—"}</td>
                  <td className="text-right tabular-nums">{c.stats ? num(c.stats.brands_detected) : "—"}</td>
                  <td className="text-gray-400 text-[12px]">{c.stats?.last_processed || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
