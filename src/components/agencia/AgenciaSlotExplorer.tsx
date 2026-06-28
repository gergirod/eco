"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaPeakGauge from "@/components/agencia/AgenciaPeakGauge";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import type { BrandSlot } from "@/lib/agencia-donde";
import { compact, vodLink } from "@/lib/format";

type SlotDetail = BrandSlot & { quote?: string };

type Props = {
  slots: SlotDetail[];
  title?: string;
};

export default function AgenciaSlotExplorer({ slots, title = "Tocá cada aparición" }: Props) {
  const [activeId, setActiveId] = useState(0);
  const sorted = useMemo(
    () => [...slots].sort((a, b) => b.concAt - a.concAt),
    [slots]
  );
  const active = sorted[activeId];

  if (!sorted.length) {
    return (
      <p className="text-[13px] text-gray-500">Sin activaciones en el período para explorar.</p>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-[14px] font-semibold text-ink mb-1">{title}</h3>
      <p className="text-[12px] text-gray-500 mb-4">
        Tocá cada aparición — ves el gauge pico/valle y la cita. No es un reporte: elegís el momento.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {sorted.map((s, i) => (
          <button
            key={`${s.videoId}-${i}`}
            type="button"
            onClick={() => setActiveId(i)}
            className={`text-[12px] px-3 py-2 rounded-lg border transition ${
              activeId === i
                ? s.isValley
                  ? "border-amber-400 bg-amber-50 text-amber-900 font-medium"
                  : "border-accent bg-accent-soft text-accent font-medium"
                : "border-[#ececec] text-gray-600 hover:border-gray-300"
            }`}
          >
            {s.channelName.split(" ")[0]} · {compact(s.concAt)}
            {s.isValley ? " ⚠" : ""}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-xl border border-[#ececec] p-4 bg-[#fafafa]">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <AgenciaBrandRoleBadge role={active.role} />
            <span className="text-[12px] text-gray-400">{active.date}</span>
          </div>
          <p className="text-[15px] font-semibold text-ink">{active.channelName}</p>
          <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{active.program}</p>

          <div className="mt-4">
            <AgenciaPeakGauge
              concAt={active.concAt}
              programPeak={active.programPeak}
            />
          </div>

          {active.quote && (
            <blockquote className="mt-4 text-[14px] italic text-gray-800 border-l-2 border-accent pl-3 leading-relaxed">
              &ldquo;{active.quote.slice(0, 280)}
              {active.quote.length > 280 ? "…" : ""}&rdquo;
            </blockquote>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {active.videoId && (
              <a
                href={vodLink(active.videoId, active.tSeconds)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-[13px] py-2"
              >
                Ir al segundo ↗
              </a>
            )}
            <Link
              href={`${AGENCIA_BASE}/marcas/${active.slug}`}
              className="btn border border-[#ececec] bg-white text-[13px] py-2"
            >
              Ficha marca
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
