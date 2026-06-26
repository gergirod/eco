"use client";

import { useMemo } from "react";
import {
  formatArs,
  PLAN_PRICE_GUIDES,
  planPriceSummary,
} from "@/lib/plan-pricing";
import { PLAN_LABELS, type PartnerPlan } from "@/lib/partners";

type Props = {
  plan: PartnerPlan;
  value: string;
  onChange: (value: string) => void;
};

export default function PlanPriceField({ plan, value, onChange }: Props) {
  const guide = PLAN_PRICE_GUIDES[plan];

  const parsed = useMemo(() => {
    const n = parseInt(value.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [value]);

  const inRange =
    parsed !== null && parsed >= guide.arsMin && parsed <= guide.arsMax;
  const belowRange = parsed !== null && parsed < guide.arsMin;
  const aboveRange = parsed !== null && parsed > guide.arsMax;

  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="p-3 rounded-lg border border-[#ececec] bg-gray-50/80">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-[12px] font-medium text-gray-700">
              Precio ARS/mes · {PLAN_LABELS[plan]}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{guide.includes}</p>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-gray-400 shrink-0">
            Ref. design partner
          </span>
        </div>
        <p className="text-[12px] text-gray-600 mb-3">
          Rango sugerido:{" "}
          <strong>
            ARS {formatArs(guide.arsMin)}–{formatArs(guide.arsMax)}
          </strong>{" "}
          <span className="text-gray-400">({guide.usdHint})</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(
            [
              ["Mín.", guide.arsMin],
              ["Referencia", guide.arsSuggested],
              ["Máx.", guide.arsMax],
            ] as const
          ).map(([label, amount]) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(String(amount))}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                parsed === amount
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "border-[#ececec] text-gray-600 hover:bg-white"
              }`}
            >
              {label} {formatArs(amount)}
            </button>
          ))}
        </div>
        <label className="block text-[12px] text-gray-600">
          Monto acordado
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
            className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
            placeholder={String(guide.arsSuggested)}
            inputMode="numeric"
          />
        </label>
        {parsed !== null && (
          <p
            className={`text-[11px] mt-2 ${
              inRange
                ? "text-green-700"
                : belowRange
                  ? "text-amber-700"
                  : "text-gray-500"
            }`}
          >
            {inRange
              ? "Dentro del rango design partner."
              : belowRange
                ? "Por debajo del rango — OK si es gancho fundador."
                : "Por encima del rango de referencia."}
          </p>
        )}
      </div>
      <p className="text-[11px] text-gray-400">{planPriceSummary(plan)}</p>
    </div>
  );
}
