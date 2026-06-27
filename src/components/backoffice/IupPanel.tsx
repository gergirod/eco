"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Bar, Stat } from "@/components/ui";
import ProgramUtilityPanel from "@/components/programs/ProgramUtilityPanel";
import {
  IUP_METHODOLOGY,
  getProgramUtility,
  tierLabel,
  tierTone,
  type ProgramUtilityExport,
} from "@/lib/programUtility";
import { useDataset } from "@/lib/useDataset";

export default function IupPanel() {
  const exportData = useDataset("program_utility") as ProgramUtilityExport;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? getProgramUtility(exportData, selectedId) : null),
    [exportData, selectedId]
  );

  const totals = exportData.totals;
  const channels = exportData.by_channel ?? [];
  const programs = exportData.programs ?? [];

  return (
    <div>
      <div className="card p-5 mb-5 bg-gray-50/80 border-[#ececec]">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">
          Solo backoffice
        </p>
        <p className="text-[14px] text-gray-700 leading-relaxed max-w-3xl">
          {IUP_METHODOLOGY.vocabulary} No visible para clientes en la plataforma comercial.
        </p>
      </div>

      {totals?.programs ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Stat label="Emisiones medidas" value={totals.programs} hint="con topics procesados" />
          <Stat label="Alta utilidad" value={totals.tier_alta} hint="IUP ≥70" />
          <Stat label="Utilidad media" value={totals.tier_media} hint="45–69" />
          <Stat label="Utilidad baja" value={totals.tier_baja} hint="25–44" />
          <Stat label="Insuficiente" value={totals.tier_insuficiente} hint="captura parcial" />
        </div>
      ) : (
        <p className="text-[13px] text-gray-500 mb-6">
          Sin datos IUP — corré <code className="text-[12px]">python export_ui.py</code>.
        </p>
      )}

      {channels.length > 0 && (
        <div className="card p-5 mb-5">
          <h2 className="text-[15px] font-semibold mb-4">IUP prom. por canal (por emisión)</h2>
          <div className="flex flex-col gap-3">
            {channels.map((c) => (
              <div key={c.channel_id}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] mb-1">
                  <Link href={`/canales/${c.channel_id}`} className="font-medium text-accent hover:underline">
                    {c.channel}
                  </Link>
                  <span className="text-gray-500 tabular-nums">
                    IUP {c.iup_avg} · {c.programs} emisiones · {c.tier_alta} alta
                  </span>
                </div>
                <Bar value={c.iup_avg} max={100} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ececec]">
            <h2 className="text-[15px] font-semibold">Emisiones por IUP</h2>
            <p className="text-[12px] text-gray-500 mt-1">Click para ver desglose</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">IUP</th>
                  <th className="text-left px-4 py-2 font-medium">Emisión</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Canal</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr
                    key={p.video_id}
                    className={`border-t border-[#f5f5f5] cursor-pointer hover:bg-gray-50/80 ${
                      selectedId === p.video_id ? "bg-accent-soft/40" : ""
                    }`}
                    onClick={() => setSelectedId(p.video_id)}
                  >
                    <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                      <span className="font-semibold">{p.iup}</span>
                      <Badge tone={tierTone(p.tier)}>{tierLabel(p.tier)}</Badge>
                    </td>
                    <td className="px-4 py-2.5 min-w-0">
                      <div className="line-clamp-2 text-gray-800">{p.title}</div>
                      {p.date ? <div className="text-[11px] text-gray-400">{p.date}</div> : null}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{p.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <ProgramUtilityPanel row={selected} defaultExpanded />
              <Link
                href={`/programas/${selected.video_id}`}
                className="text-[13px] text-accent font-medium hover:underline"
              >
                Ver emisión en plataforma (sin IUP) →
              </Link>
            </>
          ) : (
            <div className="card p-5 text-[13px] text-gray-500">
              Elegí una emisión de la tabla para ver el desglose y la metodología.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
