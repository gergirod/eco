"use client";

import { useMemo, useState } from "react";
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
  moatLabel as intelMoatLabel,
  type IcpIntel,
} from "@/lib/inteligencia-comercial";
import {
  PROFILES,
  POSITIONING,
  LEGEND,
  MATRIX,
  HORIZONS,
  NOT_SELLING,
  CHECKLIST,
  UI_MAP,
  moatLabel as casosMoatLabel,
  matrixSymbol,
} from "@/lib/casos-de-uso";

type IcpId = IcpIntel["id"];

function IntelTable({ rows, empty }: { rows: IcpIntel["today"]; empty?: string }) {
  if (rows.length === 0) return <p className="text-[13px] text-gray-400">{empty ?? "—"}</p>;
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
            const moat = intelMoatLabel(row.moat);
            return (
              <tr key={i} className="border-b border-[#f5f5f5] hover:bg-gray-50/60 align-top">
                <td className="px-4 py-3 font-medium text-gray-800">{row.question}</td>
                <td className="px-4 py-3 text-gray-600 leading-relaxed">{row.answer}</td>
                <td className="px-4 py-3"><Badge tone={conf.tone}>{conf.text}</Badge></td>
                <td className="px-4 py-3"><Badge tone={moat.tone}>{moat.text}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MoatBadge({ level }: { level?: "high" | "med" | "low" | "na" }) {
  if (!level || level === "na") return <span className="text-gray-300">—</span>;
  const { text, tone } = casosMoatLabel(level);
  return <Badge tone={tone}>{text}</Badge>;
}

export default function ComercialPanel() {
  const [icp, setIcp] = useState<IcpId>("marca");
  const [q, setQ] = useState("");

  const intel = ICP_INTEL.find((x) => x.id === icp)!;
  const profile = PROFILES.find((x) => x.id === icp)!;

  const filteredQa = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return profile.qa;
    return profile.qa.filter(
      (row) =>
        row.question.toLowerCase().includes(needle) ||
        row.answer.toLowerCase().includes(needle),
    );
  }, [profile, q]);

  return (
    <div>
      <div className="card p-5 mb-5 border-accent/20 bg-accent-soft/30">
        <p className="text-[11px] uppercase tracking-wide text-accent font-semibold mb-1">{PRODUCT_NAME}</p>
        <p className="text-[15px] font-medium text-gray-900 mb-2">{TAGLINE}</p>
        <p className="text-[13px] text-gray-700 mb-2 leading-relaxed">{UNIFIED_THESIS}</p>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          <b>Posicionamiento:</b> {POSITIONING}
        </p>
        <ul className="text-[13px] text-gray-600 space-y-1 mt-3">
          <li><b>Producto:</b> {STATUS.product}</li>
          <li><b>Negocio:</b> {STATUS.business}</li>
          <li><b>Próximo:</b> {STATUS.next}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <h2 className="text-[14px] font-semibold mb-2">{DESIGN_PARTNER.name}</h2>
          <p className="text-[12px] text-gray-500 mb-2">
            ICP: {DESIGN_PARTNER.icpPrimary}. También: {DESIGN_PARTNER.alsoValid}.
          </p>
          <ul className="text-[12.5px] text-gray-600 space-y-1 list-disc pl-4">
            {DESIGN_PARTNER.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {CONFIDENCE_LEVELS.map((lvl) => (
            <div key={lvl.id} className="card p-3">
              <Badge tone={confidenceLabel(lvl.id).tone}>{lvl.label}</Badge>
              <p className="text-[11.5px] text-gray-500 mt-1.5">{lvl.examples}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {LEGEND.products.map((block) => (
          <div key={block.sym} className="card p-3 col-span-3 sm:col-span-1">
            <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Producto {block.sym}</div>
            <p className="text-[12px] text-gray-600">{block.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {ICP_INTEL.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIcp(p.id)}
            className={`px-3.5 py-2 rounded-lg text-[13px] border transition ${
              icp === p.id
                ? "bg-accent-soft border-accent text-accent font-medium"
                : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        <input
          type="search"
          placeholder="Buscar en Q&A…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto w-full sm:w-56 px-3 py-2 text-[13px] border border-[#ececec] rounded-lg"
        />
      </div>

      {/* —— Por ICP —— */}
      <div className="space-y-5 mb-8">
        <div className="card p-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h2 className="text-[17px] font-semibold">{intel.label}</h2>
            <Badge tone="blue">{intel.product}</Badge>
          </div>
          <p className="text-[13px] text-gray-500 mb-2">{profile.subtitle}</p>
          <p className="text-[14px] text-gray-700 font-medium">{intel.buyerQuestion}</p>
          <p className="text-[13px] text-gray-500 mt-3 pl-3 border-l-2 border-accent leading-relaxed">
            {intel.callOpener}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4 border-green-100 bg-green-50/30">
            <h3 className="text-[13px] font-semibold text-green-900 mb-2">Valor hoy</h3>
            <p className="text-[13px] text-green-900/80 leading-relaxed">{intel.valueToday}</p>
          </div>
          <div className="card p-4 border-blue-100 bg-blue-50/30">
            <h3 className="text-[13px] font-semibold text-blue-900 mb-2">Valor en 90 días</h3>
            <p className="text-[13px] text-blue-900/80 leading-relaxed">{intel.value90Days}</p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Casos de uso</h3>
          <div className="grid gap-2">
            {profile.useCases.map((u) => (
              <div key={u.id} className="flex gap-3 text-[13px] py-2 border-b border-[#f3f3f3] last:border-0">
                <span className="text-gray-400 font-mono text-[11px] w-8 shrink-0 pt-0.5">{u.id}</span>
                <div>
                  <div className="font-medium text-gray-800">{u.title}</div>
                  <div className="text-gray-500 mt-0.5">{u.purpose}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
            <h3 className="text-[14px] font-semibold">Hoy — podemos responder</h3>
          </div>
          <IntelTable rows={intel.today} />
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
            <h3 className="text-[14px] font-semibold">En 90 días — con histórico</h3>
          </div>
          <IntelTable rows={intel.in90Days} />
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#ececec] bg-gray-50/80">
            <h3 className="text-[14px] font-semibold">Q&A detallado (producto y data)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
                  <th className="px-4 py-2.5 font-medium min-w-[220px]">Pregunta</th>
                  <th className="px-4 py-2.5 font-medium min-w-[240px]">Respuesta</th>
                  <th className="px-4 py-2.5 font-medium w-16">Prod.</th>
                  <th className="px-4 py-2.5 font-medium w-24">Data</th>
                  <th className="px-4 py-2.5 font-medium w-28">Moat</th>
                </tr>
              </thead>
              <tbody>
                {filteredQa.map((row, i) => (
                  <tr key={i} className="border-b border-[#f5f5f5] hover:bg-gray-50/60 align-top">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.question}</td>
                    <td className="px-4 py-3 text-gray-600 leading-relaxed">{row.answer}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">{row.product || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.data || "—"}</td>
                    <td className="px-4 py-3"><MoatBadge level={row.moat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {profile.notFocus && profile.notFocus.length > 0 && (
          <div className="card p-5 border-amber-100 bg-amber-50/40">
            <h3 className="text-[13px] font-semibold text-amber-900 mb-2">No es el foco</h3>
            <ul className="text-[13px] text-amber-900/80 space-y-1 list-disc pl-4">
              {profile.notFocus.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Frases para la call</h3>
          <ul className="space-y-2">
            {profile.callLines.map((line, i) => (
              <li key={i} className="text-[14px] text-gray-700 pl-3 border-l-2 border-accent leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* —— Referencia global —— */}
      <div className="space-y-5 border-t border-[#ececec] pt-8">
        <h2 className="text-[16px] font-semibold text-gray-800">Referencia</h2>

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Matriz — ¿quién pregunta qué?</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
                  <th className="py-2 text-left font-medium">Tema</th>
                  <th className="py-2 text-center font-medium w-20">Marca</th>
                  <th className="py-2 text-center font-medium w-20">Agencia</th>
                  <th className="py-2 text-center font-medium w-20">Canal</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.topic} className="border-b border-[#f5f5f5]">
                    <td className="py-2.5 text-gray-700">{row.topic}</td>
                    <td className="py-2.5 text-center">{matrixSymbol(row.marca)}</td>
                    <td className="py-2.5 text-center">{matrixSymbol(row.agencia)}</td>
                    <td className="py-2.5 text-center">{matrixSymbol(row.canal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Cómo crece el valor (compounding)</h3>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {HORIZONS.map((h) => (
            <div key={h.title} className="card p-4">
              <h3 className="text-[13px] font-semibold mb-2">{h.title}</h3>
              <ul className="text-[12.5px] text-gray-600 space-y-1.5 list-disc pl-4">
                {h.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-[14px] font-semibold mb-3">Pricing orientativo</h3>
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
            <h3 className="text-[14px] font-semibold mb-3">Anclas de valor (no confundir con precio)</h3>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-[14px] font-semibold mb-3">Lo que NO vendemos</h3>
            <table className="w-full text-[13px]">
              <tbody>
                {NOT_SELLING.map((row) => (
                  <tr key={row.q} className="border-b border-[#f5f5f5] align-top">
                    <td className="py-2.5 pr-3 text-gray-800 font-medium">{row.q}</td>
                    <td className="py-2.5 text-gray-500">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-semibold mb-3">Checklist pre-venta</h3>
            <ul className="space-y-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] text-gray-700 leading-relaxed">
                  <span className="text-accent shrink-0">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Dónde mostrarlo en la plataforma</h3>
          <table className="w-full text-[13px]">
            <tbody>
              {[...PLATFORM_MAP, ...UI_MAP.filter((u) => !PLATFORM_MAP.some((p) => p.href === u.href))].map(
                (row) => (
                  <tr key={"surface" in row ? row.surface : row.type} className="border-b border-[#f5f5f5]">
                    <td className="py-2.5 font-medium text-gray-800 w-[32%]">
                      {"surface" in row ? (
                        <Link href={row.href} className="text-accent hover:underline">{row.surface} →</Link>
                      ) : row.href ? (
                        <Link href={row.href} className="text-accent hover:underline">{row.type} →</Link>
                      ) : (
                        row.type
                      )}
                    </td>
                    <td className="py-2.5 text-gray-600">{"answers" in row ? row.answers : row.where}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5 border-amber-100 bg-amber-50/40">
          <h3 className="text-[14px] font-semibold text-amber-900 mb-3">Reglas en la call</h3>
          <ul className="text-[13px] text-amber-900/80 space-y-1.5 list-disc pl-4">
            {PROMISE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
