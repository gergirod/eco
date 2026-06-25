"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import OpsLogout from "@/components/OpsLogout";
import {
  PROFILES,
  POSITIONING,
  LEGEND,
  MATRIX,
  HORIZONS,
  NOT_SELLING,
  CHECKLIST,
  UI_MAP,
  moatLabel,
  matrixSymbol,
  type Profile,
} from "@/lib/casos-de-uso";

function MoatBadge({ level }: { level?: "high" | "med" | "low" | "na" }) {
  if (!level || level === "na") return <span className="text-gray-300">—</span>;
  const { text, tone } = moatLabel(level);
  return <Badge tone={tone}>{text}</Badge>;
}

function ProfilePanel({ p }: { p: Profile }) {
  return (
    <div className="space-y-5">
      <div className="card p-5" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <h2 className="text-[17px] font-semibold">{p.label}</h2>
          <Badge tone="blue">{p.product}</Badge>
        </div>
        <p className="text-[13px] text-gray-500">{p.subtitle}</p>
      </div>

      <div className="card p-5">
        <h3 className="text-[14px] font-semibold mb-3">Casos de uso</h3>
        <div className="grid gap-2">
          {p.useCases.map((u) => (
            <div
              key={u.id}
              className="flex gap-3 text-[13px] py-2 border-b border-[#f3f3f3] last:border-0"
            >
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
          <h3 className="text-[14px] font-semibold">Preguntas y respuestas</h3>
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
              {p.qa.map((row, i) => (
                <tr key={i} className="border-b border-[#f5f5f5] hover:bg-gray-50/60 align-top">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.question}</td>
                  <td className="px-4 py-3 text-gray-600 leading-relaxed">{row.answer}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-500">{row.product || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.data || "—"}</td>
                  <td className="px-4 py-3">
                    <MoatBadge level={row.moat} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {p.notFocus && p.notFocus.length > 0 && (
        <div className="card p-5 border-amber-100 bg-amber-50/40">
          <h3 className="text-[13px] font-semibold text-amber-900 mb-2">No es el foco (ya lo resuelven solos)</h3>
          <ul className="text-[13px] text-amber-900/80 space-y-1 list-disc pl-4">
            {p.notFocus.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {p.compare && (
        <div className="card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Marca vs agencia (mismo PDF)</h3>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
                <th className="py-2 text-left font-medium"> </th>
                <th className="py-2 text-left font-medium">Marca</th>
                <th className="py-2 text-left font-medium">Agencia</th>
              </tr>
            </thead>
            <tbody>
              {p.compare.map((r) => (
                <tr key={r.label} className="border-b border-[#f5f5f5]">
                  <td className="py-2.5 text-gray-500">{r.label}</td>
                  <td className="py-2.5 text-gray-800">{r.marca}</td>
                  <td className="py-2.5 text-gray-800">{r.agencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-5">
        <h3 className="text-[14px] font-semibold mb-3">Frases para la call</h3>
        <ul className="space-y-2">
          {p.callLines.map((line, i) => (
            <li key={i} className="text-[14px] text-gray-700 pl-3 border-l-2 border-accent leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CasosPage() {
  const [tab, setTab] = useState<Profile["id"]>("marca");
  const [q, setQ] = useState("");

  const profile = PROFILES.find((p) => p.id === tab)!;

  const filteredQa = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return profile.qa;
    return profile.qa.filter(
      (row) =>
        row.question.toLowerCase().includes(needle) ||
        row.answer.toLowerCase().includes(needle)
    );
  }, [profile, q]);

  const profileWithFilter = useMemo(
    () => ({ ...profile, qa: filteredQa }),
    [profile, filteredQa]
  );

  return (
    <div className="max-w-[1100px]">
      <div className="flex justify-end mb-1">
        <OpsLogout />
      </div>
      <PageHeader
        title="Casos de uso"
        sub="Referencia comercial: qué preguntan marca, agencia y canal — y qué respondemos con cada entregable."
      />

      <div className="card p-5 mb-5 border-accent/20 bg-accent-soft/30">
        <p className="text-[14px] leading-relaxed text-gray-800">
          <b>Posicionamiento:</b> {POSITIONING}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 col-span-3 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Productos</div>
          <ul className="space-y-1.5 text-[12.5px] text-gray-600">
            {LEGEND.products.map((x) => (
              <li key={x.sym}>
                <b className="text-accent">{x.sym}</b> — {x.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4 col-span-3 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Data mínima</div>
          <ul className="space-y-1.5 text-[12.5px] text-gray-600">
            {LEGEND.data.map((x) => (
              <li key={x.sym}>
                <b>{x.sym}</b> — {x.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4 col-span-3 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Moat</div>
          <ul className="space-y-1.5 text-[12.5px]">
            {LEGEND.moat.map((x) => (
              <li key={x.level} className="flex gap-2 items-start">
                <MoatBadge level={x.level} />
                <span className="text-gray-600">{x.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PROFILES.map((p) => (
          <button
            key={p.id}
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
        <input
          type="search"
          placeholder="Buscar pregunta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto w-full sm:w-56 px-3 py-2 text-[13px] border border-[#ececec] rounded-lg"
        />
      </div>

      <ProfilePanel p={profileWithFilter} />

      <div className="mt-8 space-y-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Matriz — ¿quién pregunta qué?</h2>
          <p className="text-[12px] text-gray-400 mb-3">✓✓ principal · ✓ frecuente · △ secundario · — no corresponde</p>
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
                    <td className="py-2.5 text-center tabular-nums">{matrixSymbol(row.marca)}</td>
                    <td className="py-2.5 text-center tabular-nums">{matrixSymbol(row.agencia)}</td>
                    <td className="py-2.5 text-center tabular-nums">{matrixSymbol(row.canal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <h2 className="text-[15px] font-semibold mb-3">Lo que NO vendemos</h2>
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
            <h2 className="text-[15px] font-semibold mb-3">Checklist pre-venta</h2>
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
          <h2 className="text-[15px] font-semibold mb-3">Mapa UI — dónde se responde hoy</h2>
          <table className="w-full text-[13px]">
            <tbody>
              {UI_MAP.map((row) => (
                <tr key={row.type} className="border-b border-[#f5f5f5]">
                  <td className="py-2.5 text-gray-800 font-medium w-[45%]">{row.type}</td>
                  <td className="py-2.5 text-gray-600">
                    {row.href ? (
                      <Link href={row.href} className="text-accent hover:underline">
                        {row.where} →
                      </Link>
                    ) : (
                      row.where
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
