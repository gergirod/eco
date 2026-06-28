"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import AgenciaCorpusLayers from "@/components/agencia/AgenciaCorpusLayers";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { brandRole, competitorForBrand } from "@/lib/agencia-roles";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { buildCorpusLayersForBrand } from "@/lib/agencia-product";
import { compact, fmtHMS, vodLink } from "@/lib/format";
import { useCorpus } from "@/lib/useCorpus";

type ChatReaction = {
  headline?: string;
  table_line?: string;
  tone?: string;
  has_chat?: boolean;
};

type Activation = {
  channel?: string;
  channel_name?: string;
  date?: string;
  video_id?: string;
  title?: string;
  minute?: string;
  t_seconds?: number;
  quote?: string;
  tier_label?: string;
  conc_at?: number | null;
  program_peak?: number | null;
  evidence?: string;
  sentiment?: string;
  value_usd?: number;
  has_chat?: boolean;
  chat_ratio?: number | null;
  retention_pct?: number | null;
  chat_reaction?: ChatReaction;
};

type CommercialChannel = {
  id: string;
  name: string;
  commercial_messages?: number;
  post_pnt_messages?: number;
  top_examples?: { text: string; tipo: string }[];
};

export default function AgenciaMarcaPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { config } = useAgenciaConfig();
  const { reports, meta, commercial_demand } = useCorpus(["reports", "meta", "commercial_demand"] as const);

  const allowed = [...config.brandSlugs, ...config.competitorSlugs];
  const inScope = allowed.includes(slug);

  const report = (reports as Record<string, never>)[slug] as {
    name?: string;
    mentions?: number;
    value_usd?: number;
    by_tier?: Record<string, number>;
    best?: Activation;
    detail?: Activation[];
  } | null;

  const layers = useMemo(
    () => buildCorpusLayersForBrand(slug, report, meta as never),
    [slug, report, meta]
  );

  const activations = useMemo(() => {
    const list = report?.detail?.length ? [...report.detail] : report?.best ? [report.best] : [];
    return list.sort((a, b) => (b.conc_at ?? 0) - (a.conc_at ?? 0));
  }, [report]);

  const bestAct = report?.best ?? activations[0] ?? null;

  const channelDemand = useMemo(() => {
    const chId = bestAct?.channel;
    if (!chId) return null;
    const demand = commercial_demand as { channels?: CommercialChannel[]; disclaimer?: string };
    return demand?.channels?.find((c) => c.id === chId) ?? null;
  }, [bestAct?.channel, commercial_demand]);

  const chatAct = useMemo(
    () => activations.find((a) => a.chat_reaction?.headline || a.has_chat) ?? bestAct,
    [activations, bestAct]
  );

  if (!inScope) {
    return (
      <div className="card p-8 text-[14px] text-gray-600">
        Esta marca no está en el contrato demo.{" "}
        <Link href={AGENCIA_BASE} className="text-accent hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card p-8 text-[14px] text-gray-600">
        Sin datos de captura para esta marca en el período actual.
      </div>
    );
  }

  const best = report.best;
  const role = brandRole(slug, config.brandSlugs, config.competitorSlugs);
  const rivalSlug = competitorForBrand(slug, config.pairs);
  const clientSlugForRival = config.pairs.find((p) => p.competitorSlug === slug)?.slug;

  return (
    <div className="pb-10">
      <nav className="text-[13px] text-gray-500 mb-5">
        <Link href={AGENCIA_BASE} className="hover:text-accent">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{report.name}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{report.name}</h1>
        <AgenciaBrandRoleBadge role={role} />
      </div>
      {role === "competidor" && clientSlugForRival && (
        <p className="text-[13px] text-amber-800 mb-1">
          Competidor de{" "}
          <Link href={`${AGENCIA_BASE}/marcas/${clientSlugForRival}`} className="font-medium hover:underline">
            {(reports as Record<string, { name?: string }>)[clientSlugForRival]?.name || clientSlugForRival}
          </Link>
        </p>
      )}
      {role === "cliente" && rivalSlug && (
        <p className="text-[13px] text-gray-500 mb-1">
          vs{" "}
          <Link href={`${AGENCIA_BASE}/marcas/${rivalSlug}`} className="text-amber-800 font-medium hover:underline">
            {(reports as Record<string, { name?: string }>)[rivalSlug]?.name || rivalSlug}
          </Link>
        </p>
      )}
      <p className="text-[14px] text-gray-500 mt-1">
        {report.mentions} activaciones · exposición estimada USD{" "}
        {Math.round(report.value_usd ?? 0).toLocaleString("es-AR")}
      </p>

      {best?.quote && (
        <blockquote className="mt-6 card p-6 border-l-4 border-l-accent">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
            Mejor momento · {best.tier_label}
          </p>
          <p className="text-[15px] text-ink leading-relaxed italic">
            &ldquo;{best.quote.slice(0, 320)}
            {best.quote.length > 320 ? "…" : ""}&rdquo;
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-gray-500">
            {best.conc_at ? <span>{compact(best.conc_at)} mirando</span> : null}
            {best.minute ? <span>minuto {best.minute}</span> : null}
            {best.program_peak ? (
              <span>pico programa {compact(best.program_peak)}</span>
            ) : null}
            {best.sentiment ? <span>{best.sentiment}</span> : null}
          </div>
          {best.video_id && (
            <a
              href={vodLink(best.video_id, best.t_seconds ?? 0)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-[13px] mt-4 inline-flex"
            >
              Ver en YouTube ↗
            </a>
          )}
        </blockquote>
      )}

      {chatAct?.chat_reaction?.headline && (
        <section className="mt-6 card p-5 border-l-4 border-l-green-500">
          <h2 className="text-[11px] uppercase tracking-wide text-green-700 font-medium mb-2">
            Reacción de sala
          </h2>
          <p className="text-[14px] text-ink leading-relaxed">{chatAct.chat_reaction.headline}</p>
          {chatAct.chat_reaction.table_line && (
            <p className="text-[12px] text-gray-500 mt-2">{chatAct.chat_reaction.table_line}</p>
          )}
          {chatAct.chat_ratio != null && (
            <p className="text-[12px] text-gray-400 mt-2">Ratio chat: {chatAct.chat_ratio}</p>
          )}
        </section>
      )}

      {!chatAct?.chat_reaction?.headline && chatAct?.channel === "luzu" && (
        <section className="mt-6 card p-5 bg-gray-50">
          <p className="text-[13px] text-gray-600">
            Luzu sin chat capturado en este período — no podemos medir reacción de sala.
          </p>
        </section>
      )}

      {channelDemand && (
        <section className="mt-6 card p-5">
          <h2 className="text-[14px] font-semibold mb-2">Demanda comercial en chat</h2>
          <p className="text-[13px] text-gray-600 mb-3">
            {channelDemand.name}: {channelDemand.commercial_messages ?? 0} pedidos confirmados
            {channelDemand.post_pnt_messages
              ? ` · ${channelDemand.post_pnt_messages} post-PNT`
              : ""}
          </p>
          {channelDemand.top_examples?.[0] && (
            <blockquote className="text-[13px] text-gray-700 italic border-l-2 border-gray-200 pl-3">
              «{channelDemand.top_examples[0].text.slice(0, 120)}…»
            </blockquote>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[14px] font-semibold mb-4">Todas las activaciones</h2>
        <div className="flex flex-col gap-3">
          {activations.map((act, i) => (
            <article key={`${act.video_id}-${i}`} className="card p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <span className="text-[12px] text-gray-400">{act.date}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                  {act.evidence === "VERIFIED" ? "Verificado" : act.evidence || "—"}
                </span>
              </div>
              <p className="text-[13px] font-medium text-ink mb-1">{act.channel_name}</p>
              <p className="text-[12.5px] text-gray-500 mb-2 line-clamp-2">{act.title}</p>
              <p className="text-[13px] text-gray-700 italic mb-3 line-clamp-3">
                &ldquo;{act.quote?.slice(0, 160)}…&rdquo;
              </p>
              <div className="flex flex-wrap gap-2 text-[12px] text-gray-500">
                <span>{act.tier_label}</span>
                {act.conc_at ? <span>· {compact(act.conc_at)} conc.</span> : null}
                {act.t_seconds != null ? <span>· {fmtHMS(act.t_seconds)}</span> : null}
              </div>
              {act.video_id && (
                <a
                  href={vodLink(act.video_id, act.t_seconds ?? 0)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-accent font-medium hover:underline mt-3 inline-block"
                >
                  Evidencia ↗
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <AgenciaCorpusLayers layers={layers} />
      </section>

      {report.by_tier && (
        <section className="mt-6 card p-5">
          <h2 className="text-[14px] font-semibold mb-3">Formato (tier)</h2>
          <div className="flex gap-4 text-[13px]">
            {Object.entries(report.by_tier).map(([tier, n]) => (
              <div key={tier}>
                <span className="text-gray-400">Tier {tier}</span>
                <div className="font-semibold text-ink tabular-nums">{n}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
