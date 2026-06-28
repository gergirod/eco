"use client";

import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaQuestionBlock from "@/components/agencia/AgenciaQuestionBlock";
import { formatCopyRow, type RubroIntelPack } from "@/lib/agencia-rubro-intel";
import { compact } from "@/lib/format";

type Props = {
  pack: RubroIntelPack;
};

export default function AgenciaRubroPautarView({ pack }: Props) {
  const rubro = pack.rubroLabel.toLowerCase();
  const topCopy = pack.copies[0];

  return (
    <div className="space-y-10">
      {!pack.hasCompetitor && pack.clientSlugs.length > 0 && (
        <p className="text-[13px] text-gray-600 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          En {pack.rubroLabel.toLowerCase()} no hay un rival parejo esta semana — mirá todo el rubro.
        </p>
      )}

      <AgenciaQuestionBlock question={`¿Quién está pautando en ${rubro}?`}>
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
      </AgenciaQuestionBlock>

      {pack.copies.length > 0 && (
        <AgenciaQuestionBlock question="¿Qué copy le pegó a más gente?">
          <div className="space-y-3">
            {pack.copies.slice(0, 3).map((c, i) => (
              <article
                key={`${c.slug}-${i}`}
                className={`rounded-xl border p-4 ${
                  i === 0 ? "border-accent/30 bg-accent-soft/20" : "border-[#ececec] bg-white"
                }`}
              >
                <p className="text-[15px] text-ink leading-relaxed italic">&ldquo;{c.quote}&rdquo;</p>
                <p className="text-[12px] text-gray-500 mt-3">
                  {c.brandName} · {c.channelName} · {formatCopyRow(c)}
                  {c.salioFlojo && (
                    <span className="text-amber-800 font-medium"> · salió flojo</span>
                  )}
                </p>
              </article>
            ))}
          </div>
        </AgenciaQuestionBlock>
      )}

      {(pack.bestHours.length > 0 || pack.showLines.length > 0) && (
        <AgenciaQuestionBlock question="¿A qué hora hay más gente mirando?">
          {pack.timingLine && (
            <p className="text-[14px] text-gray-700 leading-relaxed mb-4">{pack.timingLine}</p>
          )}
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
                  <span className="text-gray-400 tabular-nums shrink-0">~{compact(s.avgPeak)}</span>
                </li>
              ))}
            </ul>
          )}
        </AgenciaQuestionBlock>
      )}

      {topCopy && !topCopy.salioFlojo && (
        <p className="text-[12px] text-gray-400 -mt-4">
          Referencia: {topCopy.brandName} — {compact(topCopy.concAt)} mirando en {topCopy.channelName}.
        </p>
      )}
    </div>
  );
}
