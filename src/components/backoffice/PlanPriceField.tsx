"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyDiscount,
  DESIGN_PARTNER_DISCOUNTS,
  formatArs,
  mercadoPagoCheckoutHint,
  PLAN_PRICE_GUIDES,
  planPriceSummary,
} from "@/lib/plan-pricing";
import { PLAN_LABELS, type PartnerPlan } from "@/lib/partners";

type Props = {
  plan: PartnerPlan;
  value: string;
  onChange: (value: string) => void;
  clientId?: string;
  clientName?: string;
};

export default function PlanPriceField({
  plan,
  value,
  onChange,
  clientId,
  clientName,
}: Props) {
  const guide = PLAN_PRICE_GUIDES[plan];
  const [basePrice, setBasePrice] = useState(guide.arsSuggested);
  const [discountPct, setDiscountPct] = useState(0);
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    setBasePrice(guide.arsSuggested);
    setDiscountPct(0);
    setManualOverride(false);
    onChange(String(guide.arsSuggested));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset al cambiar plan
  }, [plan]);

  useEffect(() => {
    if (manualOverride) return;
    onChange(String(applyDiscount(basePrice, discountPct)));
  }, [basePrice, discountPct, manualOverride, onChange]);

  const parsed = useMemo(() => {
    const n = parseInt(value.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [value]);

  const inRange =
    parsed !== null && parsed >= guide.arsMin && parsed <= guide.arsMax;
  const belowRange = parsed !== null && parsed < guide.arsMin;

  const mpHint =
    parsed && clientName
      ? mercadoPagoCheckoutHint({
          amountArs: parsed,
          title: `ECO Intelligence — ${clientName}`,
          clientId,
        })
      : null;

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

        <div className="text-[11px] text-gray-500 mb-1.5">Precio lista (base)</div>
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
              onClick={() => {
                setManualOverride(false);
                setBasePrice(amount);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                !manualOverride && basePrice === amount
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "border-[#ececec] text-gray-600 hover:bg-white"
              }`}
            >
              {label} {formatArs(amount)}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-gray-500 mb-1.5">Descuento design partner</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {DESIGN_PARTNER_DISCOUNTS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => {
                setManualOverride(false);
                setDiscountPct(pct);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                !manualOverride && discountPct === pct
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "border-[#ececec] text-gray-600 hover:bg-white"
              }`}
            >
              {pct === 0 ? "Sin descuento" : `−${pct}%`}
            </button>
          ))}
        </div>

        {!manualOverride && discountPct > 0 && (
          <p className="text-[12px] text-gray-600 mb-3">
            {formatArs(basePrice)} − {discountPct}% ={" "}
            <strong className="text-ink">
              ARS {formatArs(applyDiscount(basePrice, discountPct))}
            </strong>
          </p>
        )}

        <label className="block text-[12px] text-gray-600">
          Precio final acordado (se guarda en contrato)
          <input
            value={value}
            onChange={(e) => {
              setManualOverride(true);
              onChange(e.target.value.replace(/[^\d.]/g, ""));
            }}
            className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white font-medium"
            placeholder={String(applyDiscount(basePrice, discountPct))}
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

        {parsed !== null && (
          <div className="mt-3 pt-3 border-t border-[#ececec]">
            <div className="text-[11px] text-gray-500 mb-1">Cobro Mercado Pago (próximo paso)</div>
            <p className="text-[12px] text-gray-700">
              Precio final para el link de pago:{" "}
              <strong>ARS {formatArs(parsed)}/mes</strong>
            </p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              Hoy guardás el monto acá. Después armamos el checkout MP con este precio final
              (Preferences API o suscripción).
            </p>
            {mpHint && (
              <p className="text-[10px] text-gray-400 mt-2 font-mono break-all">{mpHint}</p>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">{planPriceSummary(plan)}</p>
    </div>
  );
}
