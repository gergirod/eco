"use client";

import { useState } from "react";
import { compact, vodLink } from "@/lib/format";
import type { AgenciaPlanPack, PlanAction } from "@/lib/agencia-plan";

const ACTION_STYLE: Record<
  PlanAction["kind"],
  { chip: string; border: string }
> = {
  repeat: {
    chip: "bg-green-100 text-green-800 border-green-200",
    border: "border-green-200 bg-green-50/40",
  },
  avoid: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    border: "border-amber-200 bg-amber-50/50",
  },
  try: {
    chip: "bg-accent-soft text-accent border-accent/25",
    border: "border-[#ececec] bg-white",
  },
};

function PlanActionCard({ action }: { action: PlanAction }) {
  const style = ACTION_STYLE[action.kind];
  return (
    <article className={`rounded-xl border p-4 ${style.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${style.chip}`}
        >
          {action.label}
          {action.splitPct ? ` · ~${action.splitPct}%` : ""}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-ink">{action.channelName}</p>
      <p className="text-[12px] text-gray-500 mt-0.5">{action.program}</p>
      <p className="text-[13px] text-gray-700 mt-2">{action.detail}</p>
      {action.videoId && (
        <a
          href={vodLink(action.videoId, action.tSeconds ?? 0)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[12px] text-accent font-medium hover:underline"
        >
          Ver en YouTube ↗
        </a>
      )}
    </article>
  );
}

type Props = {
  pack: AgenciaPlanPack;
};

export default function AgenciaPlanMarca({ pack }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyWhatsApp() {
    try {
      await navigator.clipboard.writeText(pack.whatsapp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section id="plan" className="scroll-mt-6">
      <div className="rounded-2xl border border-[#dcf8c6] bg-[#f0fff4] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#075e54] text-white flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-medium">
            Plan para {pack.brandName} · {pack.rubroLabel}
          </span>
          <span className="text-[11px] opacity-80">{pack.periodLabel}</span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-2">
              Qué pasó y qué hacer el mes que viene
            </p>
            <p className="text-[15px] text-gray-800 leading-relaxed">{pack.narrative}</p>
          </div>

          {pack.historyLine && (
            <p className="text-[12px] text-gray-500 border-l-2 border-gray-200 pl-3">
              {pack.historyLine}
              {pack.totalActivationsAllTime > pack.periodActivations && (
                <span className="text-gray-400">
                  {" "}
                  · {pack.totalActivationsAllTime} placas en histórico ECO
                </span>
              )}
            </p>
          )}

          {pack.actions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pack.actions.map((a, i) => (
                <PlanActionCard key={`${a.kind}-${i}`} action={a} />
              ))}
            </div>
          )}

          {pack.history.length > 0 && (
            <details className="group rounded-xl border border-gray-100 bg-white/60">
              <summary className="cursor-pointer list-none px-4 py-3 text-[13px] text-gray-600 hover:text-ink flex items-center gap-2">
                <span className="group-open:rotate-90 transition text-gray-400">▸</span>
                Histórico de placas ({pack.history.length})
              </summary>
              <ul className="px-4 pb-4 space-y-2 border-t border-gray-50">
                {pack.history.slice(0, 12).map((h, i) => (
                  <li
                    key={`${h.videoId}-${h.tSeconds}-${i}`}
                    className={`text-[12px] flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${
                      h.isValley ? "text-amber-800" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium tabular-nums">{h.date}</span>
                    <span>
                      {h.channelName} · {h.program}
                    </span>
                    <span className="tabular-nums">{compact(h.concAt)} mirando</span>
                    {h.peakPct != null && (
                      <span className="text-gray-400">({h.peakPct}% pico)</span>
                    )}
                    <a
                      href={vodLink(h.videoId, h.tSeconds)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      ↗
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <button
            type="button"
            onClick={copyWhatsApp}
            className="btn w-full sm:w-auto border-0 bg-[#075e54] text-white text-[13px] py-2.5 hover:bg-[#064e45] font-medium"
          >
            {copied ? "Copiado ✓" : "Copiar plan para WhatsApp"}
          </button>
        </div>
      </div>
    </section>
  );
}
