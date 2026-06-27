"use client";

import Link from "next/link";
import { compact } from "@/lib/format";
import {
  canShowScheduleInsights,
  type ScheduleInsightsExport,
  type ShowScheduleInsight,
} from "@/lib/scheduleInsights";

function ShowRow({ row }: { row: ShowScheduleInsight }) {
  return (
    <Link
      href={`/canales/${row.channel_id}?tab=programas&show=${row.show_id}`}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[13.5px] text-gray-800 leading-relaxed">{row.line}</p>
      <p className="text-[12px] text-gray-400 mt-1">
        Pico ~{compact(row.avg_peak)} mirando · {row.emissions}{" "}
        {row.emissions === 1 ? "emisión medida" : "emisiones medidas"}
      </p>
    </Link>
  );
}

type Props = {
  insights: ScheduleInsightsExport | null;
  rubroLabel?: string | null;
};

export default function ScheduleInsightsSection({ insights, rubroLabel }: Props) {
  if (!insights || !canShowScheduleInsights(insights)) return null;

  const hours = insights.best_hours || [];
  const weekdays = insights.best_weekdays || [];
  const shows = insights.shows || [];

  return (
    <section className="mt-10 card p-5">
      <h2 className="text-[15px] font-semibold text-ink mb-1">¿A qué hora conviene estar?</h2>
      <p className="text-[13px] text-gray-500 mb-4 max-w-xl leading-relaxed">
        Cuándo arrancan los programas y en qué franja vimos más gente mirando — según las emisiones
        que capturamos en vivo, no el promedio del canal entero.
      </p>

      {insights.platform_line && !rubroLabel && (
        <p className="text-[13.5px] text-gray-700 mb-4 leading-relaxed">{insights.platform_line}</p>
      )}

      {(hours.length > 0 || weekdays.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {hours.slice(0, 4).map((h) => (
            <span
              key={`h-${h.hour}`}
              className="text-[12px] px-2.5 py-1 rounded-full bg-accent-soft text-accent font-medium"
            >
              {h.label} · ~{compact(h.avg_peak)} mirando
            </span>
          ))}
          {weekdays.slice(0, 2).map((d) => (
            <span
              key={`d-${d.weekday}`}
              className="text-[12px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
            >
              {d.label} · ~{compact(d.avg_peak)} mirando
            </span>
          ))}
        </div>
      )}

      {shows.length > 0 && (
        <>
          <h3 className="text-[13px] font-semibold text-ink mb-2">Por programa</h3>
          <div>
            {shows.slice(0, 8).map((row) => (
              <ShowRow key={`${row.channel_id}:${row.show_id}`} row={row} />
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-400 mt-4 max-w-xl leading-relaxed">
        Calculamos la hora de inicio con la captura en vivo y el pico de concurrentes minuto a
        minuto. Con más emisiones, la franja se afina.
      </p>
    </section>
  );
}
