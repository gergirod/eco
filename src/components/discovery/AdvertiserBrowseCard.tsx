import Link from "next/link";
import { compact } from "@/lib/format";
import type { DiscoveryBrowseItem } from "@/lib/discovery";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

function truncateQuote(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function formatChannels(ids: string[]): string {
  if (!ids.length) return "";
  return ids.map((id) => CH_NAME[id] || id).join(" · ");
}

type AdvertiserBrowseCardProps = {
  item: DiscoveryBrowseItem;
  variant?: "featured" | "default";
  badge?: string;
};

export default function AdvertiserBrowseCard({
  item,
  variant = "default",
  badge,
}: AdvertiserBrowseCardProps) {
  const peak =
    item.peakConcurrentViewers != null && item.peakConcurrentViewers > 0
      ? compact(item.peakConcurrentViewers)
      : null;

  const isFeatured = variant === "featured";
  const quoteMax = isFeatured ? 120 : 96;

  return (
    <article
      className={`flex flex-col h-full transition-all ${
        isFeatured
          ? "rounded-2xl border border-accent/20 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(47,95,224,0.08)] hover:shadow-[0_4px_20px_rgba(47,95,224,0.12)] hover:border-accent/35"
          : "card p-5 hover:border-accent/30 hover:shadow-sm"
      }`}
    >
      <h3
        className={`font-semibold text-ink leading-tight mb-2 ${
          isFeatured ? "text-[18px]" : "text-[16px]"
        }`}
      >
        {item.name}
        {badge ? (
          <span className="ml-2 text-[10px] uppercase tracking-wide font-medium text-accent align-middle">
            {badge}
          </span>
        ) : null}
      </h3>

      <p className="text-[12.5px] text-gray-400 mb-3">{formatChannels(item.channels)}</p>

      {item.highlight?.quote ? (
        <blockquote
          className={`text-gray-700 italic leading-snug flex-1 border-l-2 border-accent/30 pl-3 mb-4 ${
            isFeatured ? "text-[14px] sm:text-[15px]" : "text-[13px]"
          }`}
        >
          &ldquo;{truncateQuote(item.highlight.quote, quoteMax)}&rdquo;
        </blockquote>
      ) : (
        <div className="flex-1 mb-4" />
      )}

      <p className="text-[13px] text-gray-500 mb-4">
        <strong className="text-ink font-medium">{item.activationCount}</strong>{" "}
        {item.activationCount === 1 ? "aparición" : "apariciones"}
        {peak ? (
          <>
            {" "}
            · <strong className="text-ink font-medium">{peak}</strong> mirando
          </>
        ) : null}
      </p>

      <Link
        href={`/marcas/${item.slug}`}
        className={`font-medium text-accent hover:underline mt-auto ${
          isFeatured ? "text-[14px]" : "text-[13px]"
        }`}
      >
        Investigar →
      </Link>
    </article>
  );
}
