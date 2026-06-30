"use client";

import { useMemo, useState } from "react";
import { Bar, Stat } from "@/components/ui";
import { num } from "@/lib/format";
import {
  commercialTipoBreakdown,
  commercialTipoLabel,
  type CommercialDemandExport,
  type CommercialDemandHistoryExport,
} from "@/lib/commercialDemand";
import { useCorpus } from "@/lib/useCorpus";

function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

function fmtPer1k(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(v >= 0.1 ? 2 : 3);
}

function fmtExportDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deltaHint(current: number | null | undefined, prev: number | null | undefined): string | undefined {
  if (current == null || prev == null) return undefined;
  const d = current - prev;
  if (Math.abs(d) < 0.001) return "sin cambio vs export anterior";
  const sign = d > 0 ? "+" : "";
  return `${sign}${typeof current === "number" && current < 1 ? d.toFixed(3) : Math.round(d)} vs export anterior`;
}

export default function DemandaPanel() {
  const { commercial_demand, commercial_demand_history } = useCorpus([
    "commercial_demand",
    "commercial_demand_history",
  ] as const);

  const demand = commercial_demand as CommercialDemandExport;
  const history = commercial_demand_history as CommercialDemandHistoryExport;
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const snapshots = history.snapshots ?? [];
  const latestSnap = snapshots[s snapshots.length - 1];
  const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  const totals = useMemo(() => {
    const channels = demand.channels ?? [];
    const chat = channels.reduce((a, c) => a + (c.chat_messages || 0), 0);
    const confirmed =
      demand.filter?.confirmed_total ??
      channels.reduce((a, c) => a + (c.commercial_messages || 0), 0);
    const pct = chat > 0 ? (100 * confirmed) / chat : null;
    const per1k = channels
      .map((c) => c.commercial_per_1k)
      .filter((v): v is number => v != null);
    const postPnt = channels.reduce((a, c) => a + (c.post_pnt_messages || 0), 0);
    return {
      chat,
      confirmed,
      pct,
      per1kAvg: per1k.length ? per1k.reduce((a, b) => a + b, 0) / per1k.length : null,
      postPnt,
      withData: demand.channels_with_commercial ?? channels.filter((c) => c.commercial_messages > 0).length,
    };
  }, [demand]);

  const rankedChannels = useMemo(
    () =>
      [...(demand.channels ?? [])].sort(
        (a, b) =>
          (b.commercial_per_1k ?? 0) - (a.commercial_per_1k ?? 0) ||
          (b.commercial_messages ?? 0) - (a.commercial_messages ?? 0)
      ),
    [demand.channels]
  );

  const programs = useMemo(() => {
    const rows = demand.programs ?? [];
    if (channelFilter === "all") return rows;
    return rows.filter((p) => p.channel_id === channelFilter);
  }, [demand.programs, channelFilter]);

  const maxChannelMsgs = Math.max(...rankedChannels.map((c) => c.commercial_messages || 0), 1);

  if (!totals.confirmed && !totals.chat) {
    return (
      <div className="card p-5 text-[14px] text-gray-600 leading-relaxed">
        Todavía no hay demanda comercial exportada. Corré{" "}
        <code className="text-[12px] bg-gray-50 px-1 rounded">python export_ui.py</code> después de
        capturar chat.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-950 leading-relaxed">
        <strong>Demanda de compra en chat</strong> — pedidos confirmados de link, precio o dónde
        comprar. No certifica ventas. Sirve para monitorear señal y armar pitch a canales/marcas.
        {demand.disclaimer && <span className="block mt-2 text-amber-900/80">{demand.disclaimer}</span>}
      </div>

      {demand.summary_line && (
        <p className="text-[14px] text-gray-700 leading-relaxed">{demand.summary_line}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Pedidos confirmados"
          value={num(totals.confirmed)}
          hint={deltaHint(totals.confirmed, prevSnap?.confirmed_total)}
          info="Mensajes de chat filtrados (heurística + LLM) con intención de link, precio o compra."
        />
        <Stat
          label="% del chat"
          value={fmtPct(totals.pct, 3)}
          hint={deltaHint(totals.pct ?? null, prevSnap?.commercial_pct ?? null)}
          info="Pedidos confirmados ÷ mensajes de chat en el período exportado."
        />
        <Stat
          label="Por 1k mirando (prom.)"
          value={fmtPer1k(totals.per1kAvg)}
          hint={deltaHint(totals.per1kAvg, prevSnap?.commercial_per_1k ?? null)}
          info="Pedidos por cada mil concurrentes promedio del programa — densidad comercial normalizada."
        />
        <Stat
          label="Post-PNT (≤5 min)"
          value={num(totals.postPnt)}
          hint={`${totals.withData} canales con señal · export ${fmtExportDate(demand.period)}`}
          info="Mensajes comerciales dentro de 5 minutos después de una PNT verificada."
        />
      </div>

      {snapshots.length > 0 && (
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-1">Historial por export</h2>
          <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
            Se acumula en cada <code className="text-[11px]">export_ui.py</code> — hasta 52 snapshots.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#ececec]">
                  <th className="pb-2 pr-4 font-medium">Export</th>
                  <th className="pb-2 pr-4 font-medium tabular-nums">Pedidos</th>
                  <th className="pb-2 pr-4 font-medium tabular-nums">% chat</th>
                  <th className="pb-2 pr-4 font-medium tabular-nums">/1k</th>
                  <th className="pb-2 pr-4 font-medium tabular-nums">Olga</th>
                  <th className="pb-2 font-medium tabular-nums">Neura</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().slice(0, 8).map((s) => {
                  const olga = s.channels.find((c) => c.id === "olga");
                  const neura = s.channels.find((c) => c.id === "neura");
                  return (
                    <tr key={s.exported_at} className="border-b border-[#f5f5f5]">
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                        {fmtExportDate(s.exported_at)}
                      </td>
                      <td className="py-2 pr-4 tabular-nums font-medium">{s.confirmed_total}</td>
                      <td className="py-2 pr-4 tabular-nums">{fmtPct(s.commercial_pct, 3)}</td>
                      <td className="py-2 pr-4 tabular-nums">{fmtPer1k(s.commercial_per_1k)}</td>
                      <td className="py-2 pr-4 tabular-nums text-gray-600">
                        {olga ? `${olga.commercial_messages} (${fmtPct(olga.commercial_pct, 2)})` : "—"}
                      </td>
                      <td className="py-2 tabular-nums text-gray-600">
                        {neura
                          ? `${neura.commercial_messages} (${fmtPer1k(neura.commercial_per_1k)})`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-4">Por canal</h2>
          <div className="flex flex-col gap-3">
            {rankedChannels.map((ch) => (
              <div key={ch.id}>
                <div className="flex items-start justify-between gap-3 text-[13px] mb-1">
                  <div>
                    <span className="font-medium">{ch.name}</span>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {commercialTipoBreakdown(ch.by_tipo) ?? "sin desglose"}
                      {(ch.post_pnt_messages ?? 0) > 0 && ` · ${ch.post_pnt_messages} post-PNT`}
                    </div>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="font-medium">{ch.commercial_messages} pedidos</div>
                    <div className="text-gray-400 text-[11px]">
                      {fmtPct(ch.commercial_pct, 2)} chat · {fmtPer1k(ch.commercial_per_1k)}/1k
                    </div>
                  </div>
                </div>
                <Bar value={ch.commercial_messages || 0} max={maxChannelMsgs} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-4">Señales para pitch (top chat)</h2>
          <ul className="space-y-3">
            {(demand.top_signals ?? []).slice(0, 8).map((s) => (
              <li
                key={s.text.slice(0, 40)}
                className="rounded-lg border border-[#ececec] px-3 py-2.5 text-[13px] leading-relaxed"
              >
                <p className="text-gray-800">&ldquo;{s.text}&rdquo;</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {commercialTipoLabel(s.tipo)} · ×{s.count} · {s.n_programas}{" "}
                  {s.n_programas === 1 ? "programa" : "programas"}
                  {s.canales.length ? ` · ${s.canales.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-[15px] font-semibold">Programas con más demanda</h2>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-[13px] border border-[#ececec] rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">Todos los canales</option>
            {rankedChannels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-[#ececec]">
                <th className="pb-2 pr-3 font-medium">Programa</th>
                <th className="pb-2 pr-3 font-medium">Canal</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Pedidos</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">% chat</th>
                <th className="pb-2 font-medium tabular-nums">/1k</th>
              </tr>
            </thead>
            <tbody>
              {programs.slice(0, 12).map((p) => (
                <tr key={p.video_id} className="border-b border-[#f5f5f5] align-top">
                  <td className="py-2.5 pr-3 max-w-xs">
                    <div className="font-medium line-clamp-2">{p.title}</div>
                    {(p.top_examples ?? []).slice(0, 1).map((ex) => (
                      <div key={ex.text} className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                        &ldquo;{ex.text}&rdquo;
                      </div>
                    ))}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{p.channel}</td>
                  <td className="py-2.5 pr-3 tabular-nums font-medium">{p.commercial_messages}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{fmtPct(p.commercial_pct, 2)}</td>
                  <td className="py-2.5 tabular-nums">{fmtPer1k(p.commercial_per_1k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(demand.pnt_correlations ?? []).length > 0 && (
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-1">Cruce post-PNT</h2>
          <p className="text-[12px] text-gray-500 mb-4">
            Chat comercial dentro de 5 min después de una PNT verificada — argumento para marcas.
          </p>
          <ul className="space-y-3">
            {(demand.pnt_correlations ?? []).map((row, i) => (
              <li
                key={`${row.video_id}-${i}`}
                className="rounded-lg border border-[#ececec] px-3 py-2.5 text-[13px]"
              >
                <p className="text-gray-800">&ldquo;{row.text}&rdquo;</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {row.brand} · PNT {row.pnt_minute} → chat {row.minute} (+{row.delta_sec}s) ·{" "}
                  {row.channel ?? ""} · {row.title?.slice(0, 50)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {demand.filter && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Filtro: {demand.filter.confirmed_total ?? totals.confirmed} confirmados
          {demand.filter.llm_used
            ? ` · LLM revisó dudosos (+${demand.filter.llm_confirmed ?? 0} / −${demand.filter.llm_rejected ?? 0})`
            : " · solo heurística (sin LLM en este export)"}
          {latestSnap ? ` · historial desde ${fmtExportDate(history.updated_at)}` : ""}
        </p>
      )}
    </div>
  );
}
