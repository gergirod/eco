import Link from "next/link";
import type { NovedadEvent } from "@/lib/novedades";
import { vodLink } from "@/lib/format";

const CONFIDENCE_LABEL = {
  alta: "Alta confianza",
  media: "Confianza media",
} as const;

function actionHref(event: NovedadEvent): string {
  const { action } = event;
  switch (action.type) {
    case "marca":
      return `/marcas/${action.slug}`;
    case "canal":
      return `/canales/${action.id}`;
    case "programa":
      return `/programas/${action.videoId}`;
    case "informe":
      return `/campanas?slug=${action.campaignSlug}`;
    default:
      return "/novedades";
  }
}

type Props = {
  event: NovedadEvent;
};

export default function NovedadCard({ event }: Props) {
  const href = actionHref(event);
  const externalProgram =
    event.action.type === "programa" ? vodLink(event.action.videoId) : null;

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <time className="text-[12px] text-gray-400 tabular-nums">{event.date}</time>
        <span
          className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full ${
            event.confidence === "alta"
              ? "bg-green-50 text-green-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          {CONFIDENCE_LABEL[event.confidence]}
        </span>
      </div>

      <h2 className="text-[16px] sm:text-[17px] font-semibold text-ink leading-snug mb-2">
        {event.headline}
      </h2>
      <p className="text-[13.5px] text-gray-600 leading-relaxed mb-4 max-w-2xl">{event.why}</p>

      <div className="flex flex-wrap gap-2">
        <Link href={href} className="btn btn-primary text-[13px] py-2">
          {event.action.label}
        </Link>
        {externalProgram && (
          <a
            href={externalProgram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border border-[#ececec] text-[13px] py-2"
          >
            Ver programa ↗
          </a>
        )}
      </div>
    </article>
  );
}
