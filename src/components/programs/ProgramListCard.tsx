import Link from "next/link";
import type { Program } from "@/lib/programs";
import { brandPeakInProgram } from "@/lib/programs";
import { compact, vodLink } from "@/lib/format";

type Props = {
  program: Program;
  chName?: Record<string, string>;
  /** Si se pasa, resalta métricas de esa marca en el listado. */
  brandSlug?: string;
  showBrandChips?: boolean;
};

export default function ProgramListCard({
  program,
  chName = {},
  brandSlug,
  showBrandChips = true,
}: Props) {
  const p = program;
  const brandPeak = brandSlug ? brandPeakInProgram(p, brandSlug) : 0;
  const peak =
    brandSlug && brandPeak > 0
      ? brandPeak
      : p.pnt.reduce((best, row) => Math.max(best, row.conc_at || 0), 0) || p.peak || 0;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/programas/${p.video_id}`}
            className="text-[15px] font-semibold text-ink hover:text-accent line-clamp-2 block"
          >
            {p.title}
          </Link>
          <p className="text-[12.5px] text-gray-500 mt-1">
            {chName[p.channel] || p.channel_name} · {p.date}
            {brandSlug ? (
              <>
                {" "}
                · {p.pnt_count} {p.pnt_count === 1 ? "aparición" : "apariciones"} de la marca
                {brandPeak > 0 ? ` · pico ${compact(brandPeak)} en vivo` : ""}
              </>
            ) : (
              <>
                {p.peak ? ` · pico programa ${compact(p.peak)}` : ""}
                {p.pnt_count > 0 ? ` · ${p.pnt_count} apariciones de marcas` : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            href={`/programas/${p.video_id}`}
            className="text-[12.5px] text-accent font-medium hover:underline"
          >
            Ver programa →
          </Link>
          <a
            href={vodLink(p.video_id, p.pnt[0]?.t_seconds || 0)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-gray-400 hover:text-accent"
          >
            VOD ↗
          </a>
        </div>
      </div>
      {showBrandChips && !brandSlug && p.brands.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0f0f0]">
          {p.brands.slice(0, 8).map((slug) => {
            const row = p.pnt.find((x) => x.brand_slug === slug);
            return (
              <Link
                key={slug}
                href={`/marcas/${slug}`}
                className="text-[12px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 hover:bg-accent-soft hover:text-accent"
              >
                {row?.brand_name || slug}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
