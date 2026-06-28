"use client";

import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaStoryStep from "@/components/agencia/AgenciaStoryStep";
import {
  formatCopyRow,
  rubroIntelSummary,
  type RubroIntelPack,
} from "@/lib/agencia-rubro-intel";
import { compact } from "@/lib/format";

type Props = {
  pack: RubroIntelPack;
  stepStart?: number;
};

export default function AgenciaRubroIntel({ pack, stepStart = 2 }: Props) {
  const topBrand = pack.brands[0];
  const topCopy = pack.copies[0];
  const s1 = stepStart;
  const s2 = stepStart + 1;
  const s3 = stepStart + 2;
  const s4 = stepStart + 3;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-[20px] font-semibold text-ink tracking-tight">{pack.rubroLabel}</h2>
        <p className="text-[14px] text-gray-500 mt-1">{rubroIntelSummary(pack)}</p>
        {!pack.hasCompetitor && pack.clientSlugs.length > 0 && (
          <p className="text-[13px] text-amber-900 mt-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
            No hay rival parejo esta semana — usá el rubro entero para decidir timing y copy.
          </p>
        )}
      </div>

      <AgenciaStoryStep
        step={s1}
        title="Quién está pautando"
        subtitle="Marcas que salieron en pantalla — cuántas placas y dónde pegaron más fuerte."
      >
        <ol className="space-y-2">
          {pack.brands.slice(0, 6).map((row, i) => (
            <li
              key={row.slug}
              className="flex items-center gap-3 rounded-xl border border-[#ececec] bg-white px-4 py-3"
            >
              <span className="text-[13px] font-bold text-gray-300 tabular-nums w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`${AGENCIA_BASE}/marcas/${row.slug}`}
                    className="text-[14px] font-semibold text-ink hover:text-accent truncate"
                  >
                    {row.name}
                  </Link>
                  {row.role !== "rubro" && <AgenciaBrandRoleBadge role={row.role} />}
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {row.mentions} {row.mentions === 1 ? "placa" : "placas"} · {row.channelLabel}
                </p>
              </div>
              {row.peakConc > 0 && (
                <span className="text-[13px] font-semibold tabular-nums text-ink shrink-0">
                  {compact(row.peakConc)}
                </span>
              )}
            </li>
          ))}
        </ol>
        {topBrand && (
          <p className="text-[12px] text-gray-400 mt-3">
            Lidera {topBrand.name} con {topBrand.mentions} placas esta semana.
          </p>
        )}
      </AgenciaStoryStep>

      {pack.copies.length > 0 && (
        <AgenciaStoryStep
          step={s2}
          title="Copies que más gente miró"
          subtitle="Texto real de la placa — copiá el formato, no inventes desde cero."
        >
          <div className="space-y-3">
            {pack.copies.slice(0, 3).map((c, i) => (
              <article
                key={`${c.slug}-${i}`}
                className={`rounded-xl border p-4 ${
                  i === 0 ? "border-accent/30 bg-accent-soft/20" : "border-[#ececec] bg-white"
                }`}
              >
                {i === 0 && (
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-accent mb-2">
                    El que más pegó
                  </p>
                )}
                <p className="text-[15px] text-ink leading-relaxed italic">
                  &ldquo;{c.quote}&rdquo;
                </p>
                <p className="text-[12px] text-gray-500 mt-3">
                  <strong className="text-ink font-medium">{c.brandName}</strong> · {c.channelName}{" "}
                  · {formatCopyRow(c)}
                  {c.salioFlojo && (
                    <span className="text-amber-800 font-medium"> · salió flojo</span>
                  )}
                </p>
              </article>
            ))}
          </div>
          {topCopy && !topCopy.salioFlojo && (
            <p className="text-[12px] text-gray-400 mt-3">
              Referencia: {topCopy.brandName} en {topCopy.channelName} — {compact(topCopy.concAt)}{" "}
              mirando.
            </p>
          )}
        </AgenciaStoryStep>
      )}

      {(pack.bestHours.length > 0 || pack.showLines.length > 0) && (
        <AgenciaStoryStep
          step={s3}
          title="Cuándo conviene estar"
          subtitle={pack.timingLine ?? "Horarios y programas con más gente mirando en vivo."}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {pack.bestHours.slice(0, 3).map((h) => (
              <span
                key={h.label}
                className="text-[13px] px-3 py-1.5 rounded-full bg-accent-soft text-accent font-medium"
              >
                {h.label} · ~{compact(h.avgPeak)}
              </span>
            ))}
            {pack.bestWeekdays.slice(0, 2).map((d) => (
              <span
                key={d.label}
                className="text-[13px] px-3 py-1.5 rounded-full bg-gray-100 text-gray-600"
              >
                {d.label}
              </span>
            ))}
          </div>
          {pack.showLines.length > 0 && (
            <ul className="space-y-1.5 text-[13px] text-gray-600">
              {pack.showLines.slice(0, 4).map((s) => (
                <li key={s.line} className="flex justify-between gap-2">
                  <span>{s.line}</span>
                  <span className="text-gray-400 tabular-nums shrink-0">
                    ~{compact(s.avgPeak)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AgenciaStoryStep>
      )}

      {(pack.commercialSignals.length > 0 || pack.chatLine) && (
        <AgenciaStoryStep
          step={s4}
          title="Qué pide la gente en el chat"
          subtitle={pack.chatLine ?? "Señales de demanda — temas que la audiencia trae sola."}
        >
          <ul className="space-y-2 text-[13px] text-gray-700">
            {pack.commercialSignals.slice(0, 4).map((s) => (
              <li key={s} className="pl-3 border-l-2 border-accent/30">
                {s}
              </li>
            ))}
          </ul>
        </AgenciaStoryStep>
      )}
    </div>
  );
}
