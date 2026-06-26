import Link from "next/link";
import type { ConversacionTopic } from "@/lib/conversacion";
import { CHANNEL_SLUG } from "@/lib/conversacion";

const MOMENTUM: Record<
  ConversacionTopic["momentum"],
  { label: string; className: string }
> = {
  sube: { label: "Sube", className: "text-green-700 bg-green-50" },
  baja: { label: "Baja", className: "text-amber-800 bg-amber-50" },
  estable: { label: "Estable", className: "text-gray-600 bg-gray-100" },
  nuevo: { label: "Nuevo", className: "text-accent bg-accent-soft/50" },
};

type Props = { topic: ConversacionTopic };

export default function ConversacionRow({ topic }: Props) {
  const mom = MOMENTUM[topic.momentum];
  const spark = topic.serie.slice(-8);
  const sparkMax = Math.max(...spark.map((p) => p.n), 1);

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex gap-4">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[13px] font-semibold text-gray-500 tabular-nums"
          aria-hidden
        >
          {topic.rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h2 className="text-[16px] font-semibold text-ink leading-snug">{topic.temaLabel}</h2>
            <span
              className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full ${mom.className}`}
            >
              {mom.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500 mb-3">
            <span>{topic.menciones} menciones en audio</span>
            {topic.categoria ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="capitalize">{topic.categoria}</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {topic.canales.map((ch) => {
              const slug = CHANNEL_SLUG[ch];
              const inner = (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                  {ch}
                </span>
              );
              return slug ? (
                <Link key={ch} href={`/canales/${slug}`} className="hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                <span key={ch}>{inner}</span>
              );
            })}
            {topic.crossComunidad ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft/40 text-accent font-medium">
                Cross-canal
              </span>
            ) : null}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${topic.scorePct}%` }}
                title={`Intensidad relativa: ${topic.score}`}
              />
            </div>
            {spark.length > 1 ? (
              <div
                className="flex items-end gap-0.5 h-6"
                title="Menciones por día (últimos puntos del corpus)"
                aria-hidden
              >
                {spark.map((p, i) => (
                  <div
                    key={`${p.date}-${i}`}
                    className="w-1.5 rounded-sm bg-gray-300"
                    style={{ height: `${Math.max(15, (p.n / sparkMax) * 100)}%` }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
