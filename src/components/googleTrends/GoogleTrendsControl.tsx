"use client";

import { GOOGLE_TRENDS_EXPLAINER } from "@/lib/googleTrends";

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  enrichedCount: number;
  interestingCount?: number;
};

export default function GoogleTrendsControl({
  enabled,
  onChange,
  enrichedCount,
  interestingCount = 0,
}: Props) {
  return (
    <div className="card p-4 mb-6 border-[#ececec]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-medium text-ink">Cruce con búsquedas en Google</p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {enrichedCount > 0
              ? `${enrichedCount} tema${enrichedCount === 1 ? "" : "s"} con comparación en Argentina (12 meses)`
              : "Todavía no hay temas con cruce en este export"}
            {interestingCount > 0
              ? ` · ${interestingCount} con señal de anticipación`
              : null}
          </p>
        </div>
        <div
          className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 shrink-0"
          role="group"
          aria-label="Modo de lectura"
        >
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
              !enabled
                ? "bg-white text-ink font-medium shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Solo streaming
          </button>
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
              enabled
                ? "bg-white text-ink font-medium shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Con Google Trends
          </button>
        </div>
      </div>

      {enabled ? (
        <div className="rounded-lg bg-violet-50/60 border border-violet-100 px-3.5 py-3 text-[12.5px] text-gray-700 leading-relaxed space-y-2">
          <p className="font-medium text-violet-950">{GOOGLE_TRENDS_EXPLAINER.title}</p>
          {GOOGLE_TRENDS_EXPLAINER.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-gray-500 leading-relaxed">
          {GOOGLE_TRENDS_EXPLAINER.offHint}
        </p>
      )}
    </div>
  );
}
