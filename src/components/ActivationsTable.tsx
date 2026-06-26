"use client";

import { Badge } from "@/components/ui";
import InfoTip from "@/components/InfoTip";
import { compact, fmtHMS, vodLink } from "@/lib/format";
import { PROMINENCE_TONE, prominenceLabel } from "@/lib/prominence";
import { VALUATION_INFO, usdEst } from "@/lib/valuation";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import { chatEcoLine, chatTableLine, chatToneClass, chatToneDot } from "@/lib/chatReaction";

const TIER_TONE = PROMINENCE_TONE;
const SENT_TONE: Record<string, "green" | "gray" | "red"> = {
  positivo: "green",
  neutro: "gray",
  negativo: "red",
};

export default function ActivationsTable({
  rows,
  chName,
  onRowClick,
  variant,
  title,
  subtitle,
}: {
  rows: any[];
  chName: Record<string, string>;
  onRowClick: (row: any) => void;
  variant: "brand" | "campaign";
  title: string;
  subtitle?: string;
}) {
  const isCampaign = variant === "campaign";

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#ececec] flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">
          {title}
          {subtitle && (
            <span className="text-[11.5px] font-normal text-gray-400 ml-2">{subtitle}</span>
          )}
        </h2>
        <Badge tone="gray">{rows.length} registros</Badge>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <table>
          <thead className="sticky top-0 bg-white">
            <tr>
              <th>Fecha</th>
              <th>Canal</th>
              <th>Prueba textual</th>
              <th>Formato</th>
              {isCampaign ? <th>Respaldo</th> : <th>Sent.</th>}
              <th className="text-right">En vivo</th>
              <th>Chat en la pauta</th>
              {!isCampaign && (
                <th className="text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Exposición
                    <InfoTip text={VALUATION_INFO} label="Qué significa la exposición en USD" />
                  </span>
                </th>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={i} className="cursor-pointer" onClick={() => onRowClick(d)}>
                <td className="text-gray-500 whitespace-nowrap">{d.date}</td>
                <td className="whitespace-nowrap">{chName[d.channel] || d.channel_name}</td>
                <td className="max-w-[340px]">
                  {d.quote ? (
                    <span className="text-gray-700 italic">“{d.quote}”</span>
                  ) : (
                    <span className="text-gray-400 truncate block" title={d.title}>
                      {d.title}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {d.title?.slice(0, 48)}
                    {d.title?.length > 48 ? "…" : ""} · {fmtHMS(d.t_seconds || 0)}
                  </span>
                </td>
                <td>
                  <Badge tone={TIER_TONE[d.tier] || "gray"}>
                    {prominenceLabel(d.tier, d.tier_label)}
                  </Badge>
                </td>
                {isCampaign ? (
                  <td>
                    <Badge tone={evidenceTone(d.evidence)} title={d.evidence_reason}>
                      {evidenceLabel(d.evidence)}
                    </Badge>
                  </td>
                ) : (
                  <td>
                    <Badge tone={SENT_TONE[d.sentiment] || "gray"}>
                      {d.sentiment === "positivo" ? "＋" : d.sentiment === "negativo" ? "－" : "○"}
                    </Badge>
                  </td>
                )}
                <td className="text-right tabular-nums">
                  {d.conc_at ? compact(d.conc_at) : <span className="text-gray-300">—</span>}
                </td>
                <td className="max-w-[200px]">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${chatToneDot(d)}`}
                      aria-hidden
                    />
                    <span className={`text-[12px] leading-snug ${chatToneClass(d)}`}>
                      {chatTableLine(d)}
                    </span>
                    {chatEcoLine(d) && (
                      <span className="text-[10.5px] text-gray-500 leading-snug mt-0.5 block">
                        {chatEcoLine(d)}
                      </span>
                    )}
                  </div>
                </td>
                {!isCampaign && (
                  <td className="text-right tabular-nums text-gray-500 text-[12px]">
                    {usdEst(d.value_usd)}
                  </td>
                )}
                <td>
                  <a
                    href={vodLink(d.video_id, d.t_seconds)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-accent text-[12px] hover:underline whitespace-nowrap"
                  >
                    ver ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
