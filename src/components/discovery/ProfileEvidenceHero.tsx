import Link from "next/link";
import { Badge } from "@/components/ui";
import { compact, fmtHMS, vodLink } from "@/lib/format";
import type { DiscoveryActivation, DiscoveryAdvertiser, DiscoveryHighlight } from "@/lib/discovery";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

type ProfileEvidenceHeroProps = {
  advertiser: DiscoveryAdvertiser;
  highlight: DiscoveryHighlight | null;
  activation: DiscoveryActivation | null;
  campaignSlug?: string | null;
};

export default function ProfileEvidenceHero({
  advertiser,
  highlight,
  activation,
  campaignSlug,
}: ProfileEvidenceHeroProps) {
  const peak =
    advertiser.peakConcurrentViewers != null && advertiser.peakConcurrentViewers > 0
      ? compact(advertiser.peakConcurrentViewers)
      : null;

  const quote = highlight?.quote || activation?.quote || "";
  const program = highlight?.title || activation?.title || "";
  const channel = highlight?.channelName || activation?.channelName || "";
  const date = activation?.date || "";
  const minute = highlight?.minute || activation?.minute || fmtHMS(activation?.tSeconds || 0);
  const viewers = highlight?.concurrentViewers ?? activation?.concurrentViewers ?? null;
  const videoId = highlight?.videoId || activation?.videoId || "";
  const tSeconds = activation?.tSeconds || 0;
  const evidence = highlight?.evidence || activation?.evidence || "";

  const channelList = advertiser.channels.map((c) => CH_NAME[c] || c).join(", ");

  const scopeLine = [
    channelList && `Canales · ${channelList}`,
    advertiser.firstSeen,
    advertiser.lastSeen && advertiser.lastSeen !== advertiser.firstSeen
      ? `– ${advertiser.lastSeen}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const statsLine = (
    <>
      {advertiser.programCount} {advertiser.programCount === 1 ? "programa" : "programas"} ·{" "}
      {advertiser.activationCount}{" "}
      {advertiser.activationCount === 1 ? "aparición" : "apariciones"}
      {peak ? <> · pico {peak} mirando</> : null}
    </>
  );

  return (
    <section className="mb-8">
      {quote ? (
        <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent-soft/50 via-white to-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(47,95,224,0.06)]">
          <p className="text-[11px] uppercase tracking-wider text-accent font-medium mb-4">
            Mejor respaldo disponible
          </p>

          <blockquote className="text-[18px] sm:text-[22px] font-medium text-ink leading-snug tracking-tight mb-5">
            &ldquo;{quote}&rdquo;
          </blockquote>

          <p className="text-[13.5px] text-gray-600 mb-5">{statsLine}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-600 mb-6">
            {program && (
              <span>
                <span className="text-gray-400">Programa · </span>
                <span className="text-gray-800">{program}</span>
              </span>
            )}
            {date && (
              <span>
                <span className="text-gray-400">Fecha · </span>
                <span className="text-gray-800">{date}</span>
              </span>
            )}
            {minute && (
              <span>
                <span className="text-gray-400">Minuto · </span>
                <span className="text-gray-800 font-mono text-[12.5px]">{minute}</span>
              </span>
            )}
            {channel && (
              <span>
                <span className="text-gray-400">Canal · </span>
                <span className="text-gray-800">{channel}</span>
              </span>
            )}
            {viewers != null && viewers > 0 && (
              <span>
                <span className="text-gray-400">En vivo · </span>
                <span className="text-gray-800 font-semibold">{compact(viewers)} mirando</span>
              </span>
            )}
            {evidence && (
              <Badge tone={evidenceTone(evidence)}>{evidenceLabel(evidence)}</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {videoId ? (
              <a
                href={vodLink(videoId, tSeconds)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Ver el momento
              </a>
            ) : null}
            {campaignSlug ? (
              <Link
                href={`/campanas?slug=${campaignSlug}`}
                className="btn btn-ghost border border-gray-200"
              >
                Armar informe de entrega
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <p className="text-[13.5px] text-gray-600 mb-2">{statsLine}</p>
          <p className="text-[13.5px] text-gray-500">
            Sin cita destacada en el período observado. Revisá el inventario completo abajo.
          </p>
        </div>
      )}

      {scopeLine && <p className="mt-4 text-[12.5px] text-gray-400">{scopeLine}</p>}
    </section>
  );
}
