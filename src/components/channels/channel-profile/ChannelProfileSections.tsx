"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Bar, Stat } from "@/components/ui";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import ProgramListCard from "@/components/programs/ProgramListCard";
import { ATTENTION_DEFINITION, formatHours, formatChatEngagementLine, formatChatEngagementShort, formatChatEngagementValue, CHAT_ENGAGEMENT_DEFINITION, chatEngagementQualitative, formatChatParticipationSummary, formatProgramChatParticipation } from "@/lib/coverage";
import {
  formatCaptureHoursLine,
  getChannelCaptureHours,
  getShowCaptureHours,
  getShowCapturesForChannel,
  type LiveCaptureStats,
} from "@/lib/liveCapture";
import type { ShowFormat } from "@/lib/showFormat";
import type { ChannelBenchmark, ChannelAudience, ChannelProfile } from "@/lib/channelProfile";
import { compact, num, vodLink } from "@/lib/format";
import { PROMINENCE_BAR } from "@/lib/prominence";
import { rollupsByShow } from "@/lib/showFormat";
import type { PlacementExport } from "@/lib/placement";
import { getChannelPlacement, getShowPlacement, rubroLabel } from "@/lib/placement";
import {
  PlacementChannelCard,
  PlacementShowSnippet,
} from "@/components/placement/PlacementProfile";
import { VALUATION_HINT, VALUATION_INFO, usdEst } from "@/lib/valuation";
import CommercialDemandSection from "@/components/planning/CommercialDemandSection";
import {
  filterCommercialByChannels,
  type CommercialDemandExport,
} from "@/lib/commercialDemand";

type Props = {
  tab: ChannelProfileTabId;
  profile: ChannelProfile;
  allBenchmark: ChannelBenchmark[];
  allAudience?: ChannelAudience[];
  chName: Record<string, string>;
  onOpenActivation?: (row: ChannelProfile["activations"][0]) => void;
  /** Filtra emisiones por formato (?show=ndn). */
  showFilter?: string | null;
  placement?: PlacementExport | null;
  commercialDemand?: CommercialDemandExport | null;
  liveCapture?: LiveCaptureStats | null;
};

function SegBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
        {parts.map((p, i) => (
          <div
            key={i}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.label} <span className="tabular-nums text-gray-400">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DescripcionSection({
  profile,
  placement,
  liveCapture,
}: {
  profile: ChannelProfile;
  placement?: PlacementExport | null;
  liveCapture?: LiveCaptureStats | null;
}) {
  const { config, audience, benchmark } = profile;
  const stats = config.stats;
  const chPlacement = getChannelPlacement(placement, profile.config.id);
  const channelCapture = getChannelCaptureHours(liveCapture, profile.config.id);

  return (
    <div>
      <PlacementChannelCard placement={chPlacement} channelName={config.name} />
      <div className="card p-5 mb-5">
        <div className="text-[11px] uppercase tracking-wide text-accent font-medium mb-2">
          Qué sabemos sobre este canal
        </div>
        <p className="text-[15px] leading-relaxed text-gray-700 max-w-[820px]">
          <b>{config.name}</b>
          {config.genre ? <> es un canal de <b>{config.genre.toLowerCase()}</b></> : null}
          {config.subscribers ? <> con <b>{config.subscribers}</b> suscriptores</> : null}
          {audience ? (
            <>
              . En las últimas emisiones que medimos registramos <b>{audience.videos}</b> vivos con
              atención medida — promedio <b>{num(audience.avg_concurrent)}</b> mirando, pico{" "}
              <b>{compact(audience.peak_concurrent)}</b>.
            </>
          ) : (
            ". Todavía no hay vivos con atención medida en lo que tenemos hoy."
          )}
          {benchmark && benchmark.brands > 0 ? (
            <>
              {" "}
              <b>{benchmark.brands}</b> marcas con pauta y <b>{benchmark.mentions}</b> apariciones
              verificadas.
            </>
          ) : null}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Horas en vivo track"
          value={channelCapture ? formatHours(channelCapture.hours) : "—"}
          hint={
            channelCapture
              ? `${channelCapture.streams} ${channelCapture.streams === 1 ? "emisión" : "emisiones"} · concurrentes minuto a minuto`
              : "sin captura live en el período"
          }
          info="Tiempo medido con viewers/ al aire (ytdlp_live o youtube_api). No incluye VOD backfill."
        />
        <Stat
          label="Emisiones capturadas"
          value={stats?.videos_processed ?? audience?.videos ?? "—"}
          hint="vivos del período"
        />
        <Stat
          label="Marcas activas"
          value={benchmark?.brands ?? stats?.brands_detected ?? "—"}
          hint="con pauta verificada"
        />
        <Stat
          label="Apariciones de pauta"
          value={benchmark?.mentions ?? stats?.mentions ?? "—"}
          hint="apariciones totales"
        />
        <Stat
          label="Reproducciones del período"
          value={benchmark?.share_views != null ? `${benchmark.share_views}%` : "—"}
          hint="reproducciones acumuladas, no atención live"
        />
      </div>
    </div>
  );
}

function ProgramasSection({
  profile,
  channelId,
  placement,
  liveCapture,
}: {
  profile: ChannelProfile;
  channelId: string;
  placement?: PlacementExport | null;
  liveCapture?: LiveCaptureStats | null;
}) {
  const commercialRollups = useMemo(() => rollupsByShow(profile.programs), [profile.programs]);
  const showCaptures = useMemo(
    () => getShowCapturesForChannel(liveCapture, channelId),
    [liveCapture, channelId]
  );

  const mergedShows = useMemo(() => {
    type Row = { show: ShowFormat; rollup?: (typeof commercialRollups)[0]; capture?: (typeof showCaptures)[0] };
    const byId = new Map<string, Row>();
    for (const c of showCaptures) {
      byId.set(c.show_id, {
        show: { id: c.show_id, name: c.show_name },
        capture: c,
      });
    }
    for (const r of commercialRollups) {
      const existing = byId.get(r.show.id);
      if (existing) existing.rollup = r;
      else byId.set(r.show.id, { show: r.show, rollup: r });
    }
    return [...byId.values()].sort(
      (a, b) =>
        (b.capture?.hours ?? 0) - (a.capture?.hours ?? 0) ||
        (b.rollup?.mentionCount ?? 0) - (a.rollup?.mentionCount ?? 0) ||
        (b.rollup?.emissionCount ?? 0) - (a.rollup?.emissionCount ?? 0)
    );
  }, [commercialRollups, showCaptures]);

  if (!mergedShows.length) {
    return (
      <p className="text-[14px] text-gray-500">
        Sin programas con captura live ni marcas pautando en lo que medimos.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[13.5px] text-gray-600 mb-5 max-w-[640px] leading-relaxed">
        Un <b>programa</b> es el show (ej. Nadie Dice Nada). Cada tarjeta agrupa las{" "}
        <b>emisiones</b> de ese show. <b>Horas track</b> = tiempo en vivo medido minuto a minuto
        (concurrentes), no duración del VOD.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {mergedShows.map(({ show, rollup, capture }) => {
          const showPlacement = getShowPlacement(placement, channelId, show.id);
          const brandNames = rollup
            ? [...new Set(rollup.emissions.flatMap((e) => e.pnt.map((p) => p.brand_name)))]
            : [];
          const snippetFallback = rollup
            ? {
                brandCount: rollup.brandSlugs.size,
                brandNames,
                peakAttention: rollup.peakAttention,
                pautaMentions: showPlacement?.pauta_mentions ?? rollup.mentionCount,
              }
            : undefined;
          const captureLine = formatCaptureHoursLine(capture);
          return (
          <div key={show.id} className="card p-5">
            <h2 className="text-[16px] font-semibold text-ink mb-1">{show.name}</h2>
            {captureLine ? (
              <p className="text-[12.5px] text-accent font-medium mb-2">{captureLine}</p>
            ) : null}
            {rollup ? (
              <p className="text-[12.5px] text-gray-500 mb-4">
                {rollup.emissionCount} {rollup.emissionCount === 1 ? "emisión" : "emisiones"} con
                pauta · {rollup.mentionCount} apariciones · {rollup.brandSlugs.size}{" "}
                {rollup.brandSlugs.size === 1 ? "marca" : "marcas"}
              </p>
            ) : (
              <p className="text-[12.5px] text-gray-500 mb-4">Captura live sin pauta verificada aún.</p>
            )}
            {rollup && rollup.peakAttention > 0 ? (
              <p className="text-[12.5px] text-gray-600 mb-4">
                Pico de atención: <b>{compact(rollup.peakAttention)}</b>
              </p>
            ) : null}
            {rollup && snippetFallback ? (
              <PlacementShowSnippet
                placement={showPlacement}
                compact
                fallback={snippetFallback}
              />
            ) : null}
            {rollup ? (
              <Link
                href={`/canales/${channelId}?tab=programas&show=${show.id}`}
                className="text-[13px] text-accent font-medium hover:underline inline-block mt-2"
              >
                Ver emisiones →
              </Link>
            ) : null}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function EmisionesDrilldown({
  profile,
  chName,
  showFilter,
  channelId,
  liveCapture,
}: {
  profile: ChannelProfile;
  chName: Record<string, string>;
  showFilter?: string | null;
  channelId: string;
  liveCapture?: LiveCaptureStats | null;
}) {
  const rollups = useMemo(() => rollupsByShow(profile.programs), [profile.programs]);
  const activeRollup = showFilter
    ? rollups.find((r) => r.show.id === showFilter) || null
    : null;
  const programs = activeRollup ? activeRollup.emissions : profile.programs;
  const showCapture =
    showFilter && liveCapture
      ? getShowCaptureHours(liveCapture, channelId, showFilter)
      : null;
  const showCaptureLine = formatCaptureHoursLine(showCapture);

  if (!profile.programs.length) {
    return (
      <p className="text-[14px] text-gray-500">
        Sin emisiones con apariciones comerciales en el período.
      </p>
    );
  }

  if (showFilter && !activeRollup) {
    return (
      <p className="text-[14px] text-gray-500">
        Sin emisiones para ese programa.{" "}
        <Link href={`/canales/${channelId}?tab=programas`} className="text-accent hover:underline">
          Ver todos los programas
        </Link>
        .
      </p>
    );
  }

  if (!activeRollup) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/canales/${channelId}?tab=programas`}
          className="text-[13px] text-gray-500 hover:text-accent"
        >
          ← Programas
        </Link>
        <span className="text-[13px] text-gray-400">·</span>
        <span className="text-[14px] font-medium text-ink">{activeRollup.show.name}</span>
      </div>
      <p className="text-[13px] text-gray-500 mb-4">
        {programs.length} {programs.length === 1 ? "emisión" : "emisiones"} de{" "}
        {activeRollup.show.name} en el período.
        {showCaptureLine ? (
          <>
            {" "}
            · <span className="text-gray-700">{showCaptureLine}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-col gap-3">
        {programs.map((p) => (
          <ProgramListCard key={p.video_id} program={p} chName={chName} />
        ))}
      </div>
    </div>
  );
}

function MarcasSection({
  profile,
  placement,
}: {
  profile: ChannelProfile;
  placement?: PlacementExport | null;
}) {
  const brands = profile.benchmark?.top_brands || [];
  if (!brands.length) {
    return (
      <p className="text-[14px] text-gray-500">
        Todavía no hay marcas pautando en este canal en lo que medimos.
      </p>
    );
  }

  const maxM = Math.max(...brands.map((b) => b.mentions), 1);

  return (
    <div className="card p-5 max-w-2xl">
      <h2 className="text-[15px] font-semibold mb-4">Marcas con más apariciones</h2>
      <div className="flex flex-col gap-4">
        {brands.map((b) => (
          <div key={b.slug}>
            <div className="flex justify-between text-[13px] mb-1 gap-2">
              <div className="min-w-0">
                <Link
                  href={`/marcas/${b.slug}?channel=${profile.config.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {b.name}
                </Link>
                {"rubro" in b && b.rubro ? (
                  <span className="text-[11px] text-gray-400 ml-2">
                    {rubroLabel(placement, b.rubro)}
                  </span>
                ) : null}
              </div>
              <span className="text-gray-400 tabular-nums shrink-0">{b.mentions} apariciones</span>
            </div>
            <Bar value={b.mentions} max={maxM} />
            {b.value_usd != null && (
              <div className="text-[11px] text-gray-400 mt-0.5">{usdEst(b.value_usd)} exposición est.</div>
            )}
          </div>
        ))}
      </div>
      <Link
        href={`/marcas?channel=${profile.config.id}`}
        className="inline-block mt-5 text-[13px] text-accent font-medium hover:underline"
      >
        Ver todas las marcas en {profile.config.name} →
      </Link>
    </div>
  );
}

function ActividadSection({ profile }: { profile: ChannelProfile }) {
  const bench = profile.benchmark;
  const tierCounts = useMemo(() => {
    const t: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
    profile.activations.forEach((a) => {
      const k = String(a.tier || "3");
      t[k] = (t[k] || 0) + 1;
    });
    return t;
  }, [profile.activations]);

  const totalValue = profile.activations.reduce((s, a) => s + (a.value_usd || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat label="Marcas activas" value={bench?.brands ?? "—"} hint="con pauta en el canal" />
        <Stat label="Apariciones de pauta" value={bench?.mentions ?? profile.activations.length} hint="verificadas" />
        <Stat
          label="Exposición estimada"
          value={usdEst(totalValue)}
          hint={VALUATION_HINT}
          info={VALUATION_INFO}
        />
      </div>
      <div className="card p-5 max-w-lg">
        <h3 className="text-[13px] font-semibold mb-3">Formato de pauta en el canal</h3>
        <SegBar
          parts={PROMINENCE_BAR.map((p) => ({
            label: p.label,
            value: tierCounts[p.key as "1" | "2" | "3"] || 0,
            color: p.color,
          }))}
        />
      </div>
    </div>
  );
}

function AudienciaSection({
  profile,
  commercialDemand,
}: {
  profile: ChannelProfile;
  commercialDemand?: CommercialDemandExport | null;
}) {
  const aud = profile.audience;
  const channelCommercial = useMemo(() => {
    if (!commercialDemand?.channels?.length) return null;
    return filterCommercialByChannels(
      commercialDemand,
      new Set([profile.config.id])
    );
  }, [commercialDemand, profile.config.id]);
  if (!aud) {
    return (
      <div className="card p-6 max-w-xl">
        <p className="text-[14px] text-gray-600 leading-relaxed">
          Sin serie de audiencia capturada para este canal en el período. La medición requiere
          captura live minuto a minuto durante la emisión.
        </p>
      </div>
    );
  }

  const chatLabel =
    aud.chat_coverage === 0
      ? "Sin chat capturado en el período"
      : aud.chat_quality_label || null;
  const noiseNote =
    aud.chat_noise_score != null && aud.chat_noise_score >= 0.55
      ? "Mucho mensaje repetido en la sala — la señal de demanda puede estar diluida."
      : null;

  const participationSummary = formatChatParticipationSummary({
    avgWatching: aud.chat_avg_concurrent ?? aud.avg_concurrent,
    avgWriters: aud.chat_writers_avg,
    writersPer1k: aud.chat_writers_per_1k,
    msgsPerMinPer1k: aud.chat_msgs_per_1k_min,
  });

  return (
    <div>
      <p className="text-[13px] text-gray-500 mb-4 max-w-2xl leading-relaxed">{ATTENTION_DEFINITION}</p>
      <p className="text-[12.5px] text-gray-500 mb-4 max-w-2xl leading-relaxed">{CHAT_ENGAGEMENT_DEFINITION}</p>
      {participationSummary && aud.chat_coverage !== 0 ? (
        <div className="card p-5 mb-5 max-w-2xl">
          <h2 className="text-[15px] font-semibold mb-2">Mirando vs escribiendo</h2>
          <p className="text-[13.5px] text-gray-700 leading-relaxed">{participationSummary}</p>
          <p className="text-[12px] text-gray-500 mt-2 leading-relaxed">
            «Mirando» = concurrentes medidos minuto a minuto. «Escribieron» = cuentas distintas con al
            menos un mensaje en el chat del vivo.
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Atención prom." value={num(aud.avg_concurrent)} hint="concurrentes medidos" />
        <Stat label="Pico de atención" value={compact(aud.peak_concurrent)} hint="un minuto del vivo" />
        <Stat
          label="Cobertura chat"
          value={aud.chat_coverage != null ? `${aud.chat_coverage}%` : "—"}
          hint="de programas"
        />
        <Stat
          label="Participación en chat"
          value={
            aud.chat_writers_per_1k != null
              ? formatChatEngagementValue(aud.chat_writers_per_1k)
              : formatChatEngagementValue(aud.chat_msgs_per_1k_min)
          }
          hint={
            aud.chat_writers_per_1k != null
              ? "escribieron por cada 1.000 mirando"
              : aud.chat_msgs_per_1k_min != null
                ? "mensajes/min · por cada 1.000 mirando"
                : chatLabel || "sin chat capturado"
          }
          info={CHAT_ENGAGEMENT_DEFINITION}
        />
      </div>
      {aud.chat_msgs_per_1k_min != null && chatEngagementQualitative(aud.chat_msgs_per_1k_min) && aud.chat_coverage !== 0 ? (
        <p className="text-[13px] text-gray-600 mb-4 max-w-xl leading-relaxed">
          {chatEngagementQualitative(aud.chat_msgs_per_1k_min)}
          {chatLabel ? ` · ${chatLabel}` : ""}.
        </p>
      ) : chatLabel && aud.chat_coverage !== 0 ? (
        <p className="text-[13px] text-gray-600 mb-4 max-w-xl leading-relaxed">{chatLabel}.</p>
      ) : null}
      {noiseNote && (
        <p className="text-[12.5px] text-gray-500 mb-4 max-w-xl leading-relaxed">{noiseNote}</p>
      )}
      {aud.top_programs && aud.top_programs.length > 0 && (
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-3">Top programas por pico</h2>
          <div className="flex flex-col gap-2">
            {aud.top_programs.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-[13px]">
                <a
                  href={vodLink(p.video_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-accent hover:underline truncate"
                >
                  {p.title || p.video_id}
                </a>
                <span className="tabular-nums text-gray-500 shrink-0">{compact(p.peak)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {aud.top_programs_by_chat && aud.top_programs_by_chat.length > 0 && (
        <div className="card p-5 mt-5">
          <h2 className="text-[15px] font-semibold mb-1">Programas donde más escribe la sala</h2>
          <p className="text-[12px] text-gray-500 mb-3">Mensajes por minuto, ajustados por cuánta gente miraba.</p>
          <div className="flex flex-col gap-2">
            {aud.top_programs_by_chat.map((p, i) => {
              const chatLine = formatProgramChatParticipation(p);
              return (
              <div key={i} className="flex items-start justify-between gap-4 text-[13px] py-1">
                <Link
                  href={`/programas/${p.video_id}`}
                  className="text-gray-700 hover:text-accent hover:underline truncate min-w-0"
                >
                  {p.title || p.video_id}
                </Link>
                <div className="tabular-nums text-gray-500 shrink-0 text-right max-w-[14rem] leading-snug">
                  <div>{chatLine.primary}</div>
                  {chatLine.secondary ? (
                    <div className="text-[11.5px] text-gray-400 mt-0.5">{chatLine.secondary}</div>
                  ) : null}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
      {channelCommercial &&
        (channelCommercial.programs.length > 0 || channelCommercial.channels.length > 0) && (
          <CommercialDemandSection report={channelCommercial} mode="channel" />
        )}
    </div>
  );
}

function ComparacionesSection({
  profile,
  allBenchmark,
  allAudience = [],
}: {
  profile: ChannelProfile;
  allBenchmark: ChannelBenchmark[];
  allAudience?: ChannelAudience[];
}) {
  const currentId = profile.config.id;
  const maxShare = Math.max(...allBenchmark.map((b) => b.share_views || 0), 1);
  const maxBrands = Math.max(...allBenchmark.map((b) => b.brands || 0), 1);
  const maxAvg = Math.max(...allBenchmark.map((b) => b.avg_concurrent || 0), 1);
  const chatChannels = allAudience.filter((a) => (a.chat_coverage || 0) > 0);
  const maxChatEng = Math.max(
    ...chatChannels.map((a) => a.chat_writers_per_1k ?? a.chat_msgs_per_1k_min ?? 0),
    1
  );

  if (allBenchmark.length < 2) {
    return (
      <p className="text-[14px] text-gray-500">
        Se necesitan al menos dos canales con captura para comparar en el período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-4">Share de reproducciones (VOD)</h2>
        {allBenchmark.map((b) => (
          <div key={b.id} className={`mb-3 last:mb-0 ${b.id === currentId ? "opacity-100" : "opacity-80"}`}>
            <div className="flex justify-between text-[13px] mb-1">
              <Link
                href={`/canales/${b.id}`}
                className={b.id === currentId ? "font-semibold text-accent" : "hover:text-accent"}
              >
                {b.name}
              </Link>
              <span className="tabular-nums text-gray-500">{b.share_views ?? 0}%</span>
            </div>
            <Bar value={b.share_views || 0} max={maxShare} />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-4">Marcas activas</h2>
        {allBenchmark.map((b) => (
          <div key={b.id} className="mb-3 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1">
              <Link
                href={`/canales/${b.id}`}
                className={b.id === currentId ? "font-semibold text-accent" : "hover:text-accent"}
              >
                {b.name}
              </Link>
              <span className="tabular-nums text-gray-500">{b.brands}</span>
            </div>
            <Bar value={b.brands} max={maxBrands} />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-4">Audiencia promedio</h2>
        {allBenchmark.map((b) => (
          <div key={b.id} className="mb-3 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1">
              <Link
                href={`/canales/${b.id}`}
                className={b.id === currentId ? "font-semibold text-accent" : "hover:text-accent"}
              >
                {b.name}
              </Link>
              <span className="tabular-nums text-gray-500">
                {b.avg_concurrent ? num(b.avg_concurrent) : "—"}
              </span>
            </div>
            <Bar value={b.avg_concurrent || 0} max={maxAvg} />
          </div>
        ))}
      </div>
      {chatChannels.length >= 2 && (
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-1">Participación en chat</h2>
          <p className="text-[12px] text-gray-500 mb-4">
            Cuántos miraban vs cuántos escribieron (por cada 1.000 mirando) — solo canales con chat
            capturado.
          </p>
          {chatChannels.map((a) => (
            <div key={a.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[13px] mb-1 gap-3">
                <Link
                  href={`/canales/${a.id}?tab=audiencia`}
                  className={a.id === currentId ? "font-semibold text-accent" : "hover:text-accent"}
                >
                  {a.name}
                </Link>
                <div className="tabular-nums text-gray-500 text-right shrink-0 leading-snug">
                  <div>{compact(a.chat_avg_concurrent ?? a.avg_concurrent)} mirando</div>
                  {a.chat_writers_avg ? (
                    <div className="text-[11.5px] text-gray-400">
                      {a.chat_writers_avg.toLocaleString("es-AR")} escribieron/emisión
                      {a.chat_writers_per_1k != null
                        ? ` · ${formatChatEngagementValue(a.chat_writers_per_1k)}/1.000`
                        : ""}
                    </div>
                  ) : (
                    <div className="text-[11.5px] text-gray-400">
                      {formatChatEngagementShort(a.chat_msgs_per_1k_min ?? null)}
                    </div>
                  )}
                </div>
              </div>
              <Bar
                value={a.chat_writers_per_1k ?? a.chat_msgs_per_1k_min ?? 0}
                max={maxChatEng}
              />
              {a.chat_quality_label && (
                <div className="text-[11px] text-gray-400 mt-0.5">{a.chat_quality_label}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenciaSection({ profile }: { profile: ChannelProfile }) {
  const { evidenceSummary, activations } = profile;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-lg">
        <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
          <div className="text-[22px] font-semibold text-green-800 tabular-nums">
            {evidenceSummary.verified}
          </div>
          <div className="text-[11px] text-green-700 mt-0.5">Completo</div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
          <div className="text-[22px] font-semibold text-amber-900 tabular-nums">
            {evidenceSummary.partial}
          </div>
          <div className="text-[11px] text-amber-800 mt-0.5">Parcial</div>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
          <div className="text-[22px] font-semibold text-red-800 tabular-nums">
            {evidenceSummary.insufficient}
          </div>
          <div className="text-[11px] text-red-700 mt-0.5">Insuficiente</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table>
          <thead className="sticky top-0 bg-white">
            <tr>
              <th>Marca</th>
              <th>Fecha</th>
              <th>Prueba</th>
              <th>Respaldo</th>
              <th className="text-right">Atención</th>
            </tr>
          </thead>
          <tbody>
            {activations.slice(0, 50).map((a, i) => (
              <tr key={i}>
                <td>
                  <Link href={`/marcas/${a.brand_slug}`} className="text-accent hover:underline text-[12.5px]">
                    {a.brand_name}
                  </Link>
                </td>
                <td className="text-gray-500 whitespace-nowrap text-[12.5px]">{a.date}</td>
                <td className="max-w-[240px] text-[12.5px] italic text-gray-600 line-clamp-2">
                  {a.quote ? `“${a.quote}”` : a.title}
                </td>
                <td>
                  <Badge tone={evidenceTone(a.evidence)}>{evidenceLabel(a.evidence)}</Badge>
                </td>
                <td className="text-right tabular-nums text-[12.5px]">
                  {a.conc_at ? compact(a.conc_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activations.length > 50 && (
        <p className="text-[12px] text-gray-400 mt-2">
          Mostrando 50 de {activations.length} apariciones.
        </p>
      )}
    </div>
  );
}

export default function ChannelProfileSections({
  tab,
  profile,
  allBenchmark,
  allAudience,
  chName,
  showFilter,
  placement,
  commercialDemand,
  liveCapture,
}: Props) {
  const channelId = profile.config.id;

  switch (tab) {
    case "descripcion":
      return (
        <DescripcionSection profile={profile} placement={placement} liveCapture={liveCapture} />
      );
    case "programas":
      if (showFilter) {
        return (
          <EmisionesDrilldown
            profile={profile}
            chName={chName}
            showFilter={showFilter}
            channelId={channelId}
            liveCapture={liveCapture}
          />
        );
      }
      return (
        <ProgramasSection
          profile={profile}
          channelId={channelId}
          placement={placement}
          liveCapture={liveCapture}
        />
      );
    case "marcas":
      return <MarcasSection profile={profile} placement={placement} />;
    case "actividad":
      return <ActividadSection profile={profile} />;
    case "audiencia":
      return <AudienciaSection profile={profile} commercialDemand={commercialDemand} />;
    case "comparaciones":
      return (
        <ComparacionesSection
          profile={profile}
          allBenchmark={allBenchmark}
          allAudience={allAudience}
        />
      );
    case "evidencia":
      return <EvidenciaSection profile={profile} />;
    default:
      return null;
  }
}
