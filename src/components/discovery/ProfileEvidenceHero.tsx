import Link from "next/link";
import { Badge } from "@/components/ui";
import { compact, fmtHMS, vodLink } from "@/lib/format";
import type { DiscoveryActivation, DiscoveryAdvertiser, DiscoveryHighlight } from "@/lib/discovery";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

const IOL_CAMPAIGN_SLUG = "iol-jun-2026";

type ProfileEvidenceHeroProps = {
  advertiser: DiscoveryAdvertiser;
  highlight: DiscoveryHighlight | null;
  activation: DiscoveryActivation | null;
};

export default function ProfileEvidenceHero({
  advertiser,
  highlight,
  activation,
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

  return (
    <section className="mb-8">
      <p className="text-[15px] sm:text-[17px] text-gray-700 leading-relaxed max-w-3xl mb-6">
        <strong className="text-ink font-semibold">{advertiser.name}</strong> apareció en{" "}
        <strong className="text-ink font-medium">{advertiser.programCount}</strong>{" "}
        {advertiser.programCount === 1 ? "programa" : "programas"} con{" "}
        <strong className="text-ink font-medium">{advertiser.activationCount}</strong>{" "}
        {advertiser.activationCount === 1 ? "activación" : "activaciones"} de pauta
        {peak ? (
          <>
            {" "}
            — pico de <strong className="text-ink font-medium">{peak}</strong> mirando
          </>
        ) : null}
        .
      </p>

      {quote ? (
        <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent-soft/50 via-white to-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(47,95,224,0.06)]">
          <p className="text-[11px] uppercase tracking-wider text-accent font-medium mb-4">
            Mejor evidencia disponible
          </p>

          <blockquote className="text-[18px] sm:text-[20px] font-medium text-ink leading-snug tracking-tight mb-6">
            &ldquo;{quote}&rdquo;
          </blockquote>

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
            {advertiser.slug === "iol-inversiones" ? (
              <Link
                href={`/campaign?slug=${IOL_CAMPAIGN_SLUG}`}
                className="btn btn-ghost border border-gray-200"
              >
                Auditar campaña IOL
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-[13.5px] text-gray-500">
          Sin cita destacada en el período observado. Revisá el inventario completo abajo.
        </div>
      )}

      <p className="mt-4 text-[12.5px] text-gray-400">
        {channelList && <>Canales · {channelList} · </>}
        {advertiser.firstSeen}
        {advertiser.lastSeen && advertiser.lastSeen !== advertiser.firstSeen
          ? ` – ${advertiser.lastSeen}`
          : ""}
      </p>
    </section>
  );
}
