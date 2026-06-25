"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  TAGLINE,
  UNIFIED_THESIS,
  PRODUCT_NAME,
  DESIGN_PARTNER,
  STATUS,
  CONFIDENCE_LEVELS,
  ICP_INTEL,
  COMPOUNDING,
  PRICING,
  VALUE_ANCHORS,
  PROMISE_RULES,
  PLATFORM_MAP,
  confidenceLabel,
  moatLabel,
  type IcpIntel,
} from "@/lib/inteligencia-comercial";

function IntelTable({ rows, empty }: { rows: IcpIntel["today"]; empty?: string }) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-gray-400">{empty ?? "—"}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
            <th className="px-4 py-2.5 font-medium min-w-[200px]">Pregunta</th>
            <th className="px-4 py-2.5 font-medium min-w-[240px]">Respuesta</th>
            <th className="px-4 py-2.5 font-medium w-28">Nivel</th>
            <th className="px-4 py-2.5 font-medium w-28">Moat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const conf = confidenceLabel(row.confidence);
            const moat = moatLabel(row.moat);
            return (
              <tr key={i} className="border-b border-[#f5f5f5] hover:bg-gray-50/60 align-top">
                <td className="px-4 py-3 font-medium text-gray-800">{row.question}</td>
                <td className="px-4 py-3 text-gray-600 leading-relaxed">{row.answer}</td>
                <td className="px-4 py-3">
                  <Badge tone={conf.tone}>{conf.text}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={moat.tone}>{moat.text}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IcpSection({ icp }: { icp: IcpIntel }) {
  return (
    <div className="space-y-4">
      <div className="card p-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <h2 className="text-[17px] font-semibold">{icp.label}</h2>
          <Badge tone="blue">{icp.product}</Badge>
        </div>
        <p className="text-[14px] text-gray-700 font-medium mt-2">{icp.buyerQuestion}</p>
        <p className="text-[13px] text-gray-500 mt-3 pl-3 border-l-2 border-accent leading-relaxed">
          {icp.callOpener}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 border-green-100 bg-green-50/30">
          <h3 className="text-[13px] font-semibold text-green-900 mb-2">Valor hoy</h3>
          <p className="text-[13px] text-green-900/80 leading-relaxed">{icp.valueToday}</p>
        </div>
        <div className="card p-4 border-blue-100 bg-blue-50/30">
          <h3 className="text-[13px] font-semibold text-blue-900 mb-2">Valor en 90 días</h3>
          <p className="text-[13px] text-blue-900/80 leading-relaxed">{icp.value90Days}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
          <h3 className="text-[14px] font-semibold">Hoy — podemos responder</h3>
        </div>
        <IntelTable rows={icp.today} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
          <h3 className="text-[14px] font-semibold">En 90 días — con histórico</h3>
        </div>
        <IntelTable rows={icp.in90Days} />
      </div>
    </div>
  );
}

export default function InteligenciaPanel() {
  const [tab, setTab] = useState<IcpIntel["id"]>("marca");
  const icp = ICP_INTEL.find((x) => x.id === tab)!;

  return (
    <div>
      <div className="card p-5 mb-5 border-accent/20 bg-accent-soft/30">
        <p className="text-[11px] uppercase tracking-wide text-accent font-semibold mb-1">{PRODUCT_NAME}</p>
        <p className="text-[15px] font-medium text-gray-900 mb-2">{TAGLINE}</p>
        <p className="text-[13px] text-gray-700 mb-3 leading-relaxed">{UNIFIED_THESIS}</p>
        <ul className="text-[13px] text-gray-600 space-y-1">
          <li>
            <b>Producto:</b> {STATUS.product}
          </li>
          <li>
            <b>Negocio:</b> {STATUS.business}
          </li>
          <li>
            <b>Próximo:</b> {STATUS.next}
          </li>
        </ul>
      </div>

      <div className="card p-5 mb-5">
        <h2 className="text-[15px] font-semibold mb-2">{DESIGN_PARTNER.name}</h2>
        <p className="text-[12px] text-gray-500 mb-3">
          ICP primario: {DESIGN_PARTNER.icpPrimary}. También: {DESIGN_PARTNER.alsoValid}.
        </p>
        <ul className="text-[13px] text-gray-700 space-y-1.5 list-disc pl-4">
          {DESIGN_PARTNER.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {CONFIDENCE_LEVELS.map((lvl) => (
          <div key={lvl.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={confidenceLabel(lvl.id).tone}>{lvl.label}</Badge>
            </div>
            <p className="text-[12.5px] text-gray-600 mb-2">{lvl.description}</p>
            <p className="text-[11.5px] text-gray-400">{lvl.examples}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {ICP_INTEL.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setTab(p.id)}
            className={`px-3.5 py-2 rounded-lg text-[13px] border transition ${
              tab === p.id
                ? "bg-accent-soft border-accent text-accent font-medium"
                : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <IcpSection icp={icp} />

      <div className="mt-8 space-y-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Cómo crece el valor (compounding)</h2>
          <div className="grid gap-3">
            {COMPOUNDING.map((row) => (
              <div
                key={row.horizon}
                className="grid grid-cols-1 lg:grid-cols-3 gap-2 py-3 border-b border-[#f5f5f5] last:border-0 text-[13px]"
              >
                <div className="font-medium text-gray-800">{row.horizon}</div>
                <div className="text-gray-600">{row.unlocks}</div>
                <div className="text-gray-500 italic">{row.irreversible}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="text-[15px] font-semibold mb-3">Pricing orientativo</h2>
            <table className="w-full text-[13px]">
              <tbody>
                {PRICING.map((row) => (
                  <tr key={row.stage} className="border-b border-[#f5f5f5]">
                    <td className="py-2.5 font-medium text-gray-800 w-[40%]">{row.stage}</td>
                    <td className="py-2.5 text-accent font-medium tabular-nums">{row.ticket}</td>
                    <td className="py-2.5 text-gray-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <h2 className="text-[15px] font-semibold mb-3">Anclas de valor (no confundir con precio)</h2>
            <table className="w-full text-[13px]">
              <tbody>
                {VALUE_ANCHORS.map((row) => (
                  <tr key={row.anchor} className="border-b border-[#f5f5f5]">
                    <td className="py-2.5 font-medium text-gray-800">{row.anchor}</td>
                    <td className="py-2.5 tabular-nums text-gray-700">{row.ref}</td>
                    <td className="py-2.5 text-gray-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 border-amber-100 bg-amber-50/40">
          <h2 className="text-[15px] font-semibold text-amber-900 mb-3">Reglas en la call</h2>
          <ul className="text-[13px] text-amber-900/80 space-y-1.5 list-disc pl-4">
            {PROMISE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Dónde mostrarlo en la plataforma</h2>
          <table className="w-full text-[13px]">
            <tbody>
              {PLATFORM_MAP.map((row) => (
                <tr key={row.surface} className="border-b border-[#f5f5f5]">
                  <td className="py-2.5 font-medium text-gray-800 w-[28%]">
                    <Link href={row.href} className="text-accent hover:underline">
                      {row.surface} →
                    </Link>
                  </td>
                  <td className="py-2.5 text-gray-600">{row.answers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
