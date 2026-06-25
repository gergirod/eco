"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProfileEvidenceHero from "@/components/discovery/ProfileEvidenceHero";
import { Badge } from "@/components/ui";
import { compact, vodLink } from "@/lib/format";
import {
  getAdvertiserProfile,
  loadDiscoveryDataset,
  pickHighlightActivation,
} from "@/lib/discovery";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import channelsBundle from "@/data/channels.json";

const CH_NAME: Record<string, string> = Object.fromEntries(
  (channelsBundle as { id: string; name: string }[]).map((c) => [c.id, c.name])
);

const IOL_CAMPAIGN_SLUG = "iol-jun-2026";

export default function AdvertiserProfilePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [tableOpen, setTableOpen] = useState(false);

  const profile = useMemo(
    () => getAdvertiserProfile(slug, loadDiscoveryDataset()),
    [slug]
  );

  const topActivation = useMemo(() => {
    const activations = profile?.activations ?? [];
    if (!activations.length) return null;
    const withQuote = activations.filter((a) => a.quote.trim());
    const pool = withQuote.length ? withQuote : activations;
    return [...pool].sort(
      (a, b) => (b.concurrentViewers ?? 0) - (a.concurrentViewers ?? 0)
    )[0];
  }, [profile]);

  const featuredHighlight = useMemo(() => {
    if (!profile) return null;
    return profile.highlight ?? pickHighlightActivation(profile.activations);
  }, [profile]);

  if (!profile || profile.advertiser.confidenceTier === "detected") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Anunciante no disponible</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Este anunciante no tiene evidencia suficiente para mostrar un perfil de investigación.
        </p>
        <Link
          href="/discover"
          className="inline-block mt-5 text-[13px] text-accent font-medium hover:underline"
        >
          ← Volver a anunciantes
        </Link>
      </div>
    );
  }

  const { advertiser, activations } = profile;

  return (
    <div className="max-w-4xl pb-10">
      <Link
        href="/discover"
        className="text-[13px] text-gray-500 hover:text-accent mb-5 inline-block"
      >
        ← Anunciantes
      </Link>

      <header className="mb-2">
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-ink">
          {advertiser.name}
        </h1>
      </header>

      <ProfileEvidenceHero
        advertiser={advertiser}
        highlight={featuredHighlight}
        activation={topActivation}
      />

      <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-[#ececec]">
        {slug === "iol-inversiones" ? (
          <Link href={`/campaign?slug=${IOL_CAMPAIGN_SLUG}`} className="btn btn-primary">
            Auditar campaña en Campaign Intelligence
          </Link>
        ) : (
          <Link href="/discover" className="btn btn-primary">
            Explorar más anunciantes
          </Link>
        )}
        <Link
          href={`/marca?brand=${encodeURIComponent(advertiser.slug)}`}
          className="text-[12.5px] text-gray-500 hover:text-accent"
        >
          Ver histórico longitudinal →
        </Link>
      </div>

      <section>
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 py-3 text-left group"
          aria-expanded={tableOpen}
        >
          <span className="text-[15px] font-semibold text-ink group-hover:text-accent transition-colors">
            Todas las activaciones ({activations.length})
          </span>
          <span className="text-[12px] text-gray-400 shrink-0">
            {tableOpen ? "Ocultar" : "Ver inventario completo"}
          </span>
        </button>

        {tableOpen && (
          <div className="card overflow-hidden mt-2">
            <div className="overflow-auto">
              <table>
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Fecha</th>
                    <th>Prueba textual</th>
                    <th>Programa</th>
                    <th>Canal</th>
                    <th>Evidencia</th>
                    <th className="text-right">En vivo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((a, i) => (
                    <tr key={`${a.videoId}-${i}`}>
                      <td className="text-gray-500 whitespace-nowrap text-[12.5px]">{a.date}</td>
                      <td className="max-w-[220px]">
                        {a.quote ? (
                          <span className="text-gray-700 italic text-[12.5px] line-clamp-2">
                            &ldquo;{a.quote}&rdquo;
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="max-w-[160px] truncate text-[12.5px]" title={a.title}>
                        {a.title}
                      </td>
                      <td className="whitespace-nowrap text-[12.5px]">
                        {a.channelName || CH_NAME[a.channel]}
                      </td>
                      <td>
                        <Badge tone={evidenceTone(a.evidence)} title={a.evidenceReason}>
                          {evidenceLabel(a.evidence)}
                        </Badge>
                      </td>
                      <td className="text-right tabular-nums text-[12.5px]">
                        {a.concurrentViewers ? compact(a.concurrentViewers) : "—"}
                      </td>
                      <td>
                        {a.videoId ? (
                          <a
                            href={vodLink(a.videoId, a.tSeconds)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-accent hover:underline whitespace-nowrap"
                          >
                            Ver momento
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
