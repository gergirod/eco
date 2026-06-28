"use client";

import { useState } from "react";
import type { RubroShareRow } from "@/lib/agencia-product";

type Mode = "cliente" | "competidor" | "ambos";

type Props = {
  rows: RubroShareRow[];
  clientSlug: string;
  competitorSlug: string;
};

export default function AgenciaRivalCompare({ rows, clientSlug, competitorSlug }: Props) {
  const [mode, setMode] = useState<Mode>("ambos");

  const client = rows.find((r) => r.slug === clientSlug);
  const rival = rows.find((r) => r.slug === competitorSlug);
  const max = Math.max(...rows.map((r) => r.sharePct), 1);

  const visible =
    mode === "cliente"
      ? rows.filter((r) => r.slug === clientSlug)
      : mode === "competidor"
        ? rows.filter((r) => r.slug === competitorSlug)
        : rows.filter((r) => r.slug === clientSlug || r.slug === competitorSlug);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["ambos", "Lado a lado"],
            ["cliente", "Tu marca"],
            ["competidor", "Rival"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`text-[12px] px-3 py-1.5 rounded-full border ${
              mode === id ? "border-accent bg-accent-soft text-accent font-medium" : "border-[#ececec] text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((row) => {
          const isClient = row.slug === clientSlug;
          return (
            <div key={row.slug}>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-medium text-ink">
                  {row.name}
                  <span
                    className={`ml-2 text-[10px] uppercase ${
                      isClient ? "text-accent" : "text-amber-700"
                    }`}
                  >
                    {isClient ? "Tu marca" : "Competidor"}
                  </span>
                </span>
                <span className="text-gray-400 tabular-nums">
                  {row.sharePct.toFixed(0)}% · {row.mentions} PNT
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isClient ? "bg-accent" : "bg-amber-500"
                  }`}
                  style={{ width: `${(row.sharePct / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {mode === "ambos" && client && rival && (
        <p className="text-[12px] text-gray-500 mt-4">
          {client.sharePct > rival.sharePct
            ? `${client.name} concentra más atención en el rubro esta semana.`
            : `${rival.name} va adelante en exposición estimada.`}
        </p>
      )}
    </div>
  );
}
