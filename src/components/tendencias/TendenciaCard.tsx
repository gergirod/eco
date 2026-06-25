import Link from "next/link";
import type { TendenciaInsight } from "@/lib/tendencias";

const CONFIDENCE_STYLE: Record<
  TendenciaInsight["confidence"],
  { label: string; className: string }
> = {
  evidencia: {
    label: "Evidencia",
    className: "bg-green-50 text-green-800",
  },
  conversacion: {
    label: "Conversación",
    className: "bg-slate-100 text-slate-700",
  },
  insight: {
    label: "Insight",
    className: "bg-accent-soft text-accent",
  },
};

type Props = {
  insight: TendenciaInsight;
};

export default function TendenciaCard({ insight }: Props) {
  const style = CONFIDENCE_STYLE[insight.confidence];

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <span className="text-[12px] text-gray-400">{insight.period}</span>
        <span
          className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full ${style.className}`}
        >
          {style.label}
        </span>
      </div>

      <h2 className="text-[16px] sm:text-[17px] font-semibold text-ink leading-snug mb-3">
        {insight.pattern}
      </h2>

      <p className="text-[13.5px] text-gray-700 leading-relaxed mb-2 max-w-2xl">
        <span className="font-medium text-ink">Implica: </span>
        {insight.implication}
      </p>

      <p className="text-[11.5px] text-gray-400 leading-relaxed mb-4 max-w-2xl">{insight.coverage}</p>

      <details className="mb-4 group">
        <summary className="text-[12px] text-gray-500 cursor-pointer hover:text-accent list-none">
          <span className="group-open:hidden">Ver señales →</span>
          <span className="hidden group-open:inline">Ocultar señales</span>
        </summary>
        <ul className="mt-2 pl-4 text-[12px] text-gray-500 space-y-1 list-disc">
          {insight.signals.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </details>

      <Link href={insight.action.href} className="btn btn-primary text-[13px] py-2">
        {insight.action.label}
      </Link>
    </article>
  );
}
