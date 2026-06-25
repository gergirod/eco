"use client";

import { useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import {
  SECTIONS,
  CHANNELS,
  CHECKLIST,
  TROUBLESHOOT,
  IRREVERSIBLE,
  DAY_FLOW,
} from "@/lib/operacion";

function CopyBlock({ cmds }: { cmds: string[] }) {
  const text = cmds.join("\n");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-[#1a1f26] text-[#e8edf2] text-[12.5px] leading-relaxed rounded-lg p-4 overflow-x-auto font-mono">
        {text}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 rounded text-[11px] bg-white/10 text-white/80 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export default function OperacionPage() {
  const [tab, setTab] = useState(SECTIONS[1].id);
  const section = SECTIONS.find((s) => s.id === tab) || SECTIONS[0];

  return (
    <div className="max-w-[900px]">
      <PageHeader
        title="Operación"
        sub="Runbook interno: captura en vivo mañana, pipeline y publicación a Supabase / web."
      />

      <div className="card p-4 mb-5 border-amber-200 bg-amber-50/50">
        <div className="text-[13px] font-semibold text-amber-900 mb-2">Checklist antes de arrancar</div>
        <ul className="grid sm:grid-cols-2 gap-1.5 text-[12.5px] text-amber-900/90">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-amber-600">□</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5 mb-5">
        <h2 className="text-[14px] font-semibold mb-3">Canales activos (8)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
                <th className="py-2 text-left font-medium w-24">ID</th>
                <th className="py-2 text-left font-medium">URL /live</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((c) => (
                <tr key={c.id} className="border-b border-[#f5f5f5]">
                  <td className="py-2 font-mono text-accent">{c.id}</td>
                  <td className="py-2">
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-accent break-all">
                      {c.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">Luzu: sin chat en vivo — solo concurrentes.</p>
      </div>

      <div className="card p-5 mb-5 bg-accent-soft/40 border-accent/15">
        <h2 className="text-[14px] font-semibold mb-2">Día típico</h2>
        <pre className="text-[12.5px] text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{DAY_FLOW}</pre>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] border transition ${
              tab === s.id
                ? "bg-accent-soft border-accent text-accent font-medium"
                : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        {section.intro && <p className="text-[13px] text-gray-600 leading-relaxed">{section.intro}</p>}
        {section.blocks.map((b) => (
          <div key={b.title} className="card p-5">
            <h3 className="text-[14px] font-semibold mb-1">{b.title}</h3>
            {b.desc && <p className="text-[12px] text-gray-500 mb-3">{b.desc}</p>}
            <CopyBlock cmds={b.cmds} />
          </div>
        ))}
        {section.bullets && (
          <ul className="text-[13px] text-gray-600 space-y-1.5 list-disc pl-5">
            {section.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-5">
          <h2 className="text-[14px] font-semibold mb-3">Troubleshooting</h2>
          <table className="w-full text-[13px]">
            <tbody>
              {TROUBLESHOOT.map((r) => (
                <tr key={r.symptom} className="border-b border-[#f5f5f5] align-top">
                  <td className="py-2 pr-3 font-medium text-gray-800 w-[40%]">{r.symptom}</td>
                  <td className="py-2 text-gray-600">{r.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h2 className="text-[14px] font-semibold mb-3">Qué es irreversible (moat)</h2>
          <table className="w-full text-[13px]">
            <tbody>
              {IRREVERSIBLE.map((r) => (
                <tr key={r.dato} className="border-b border-[#f5f5f5]">
                  <td className="py-2 text-gray-800">{r.dato}</td>
                  <td className="py-2 text-gray-600">{r.recover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] text-gray-400 leading-relaxed">
        Markdown completo en el repo: <code className="text-gray-500">OPERACION.md</code> (raíz streaming-project).
        También: <Badge tone="gray">/casos</Badge> para ventas · <Badge tone="gray">/backoffice</Badge> para estado en vivo.
      </div>
    </div>
  );
}
