"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Bar, Stat } from "@/components/ui";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import ProgramListCard from "@/components/programs/ProgramListCard";
import type { ChannelBenchmark, ChannelProfile } from "@/lib/channelProfile";
import { compact, num, vodLink } from "@/lib/format";
import { PROMINENCE_BAR } from "@/lib/prominence";
import { VALUATION_HINT, VALUATION_INFO, usdEst } from "@/lib/valuation";
import type { ChannelProfileTabId } from "./tabs";

type Props = {
  tab: ChannelProfileTabId;
  profile: ChannelProfile;
  allBenchmark: ChannelBenchmark[];
  chName: Record<string, string>;
  onOpenActivation?: (row: ChannelProfile["activations"][0]) => void;
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

function DescripcionSection({ profile }: { profile: ChannelProfile }) {
  const { config, audience, benchmark } = profile;
  const stats = config.stats;

  return (
    <div>
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
              . En el período capturado registramos <b>{audience.videos}</b> programas con audiencia
              medida — promedio <b>{num(audience.avg_concurrent)}</b> concurrentes, pico{" "}
              <b>{compact(audience.peak_concurrent)}</b>.
            </>
          ) : (
            ". Sin emisiones con audiencia verificable en el período actual."
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
          label="Programas capturados"
          value={stats?.videos_processed ?? audience?.videos ?? "—"}
          hint="con data en el período"
        />
        <Stat
          label="Marcas activas"
          value={benchmark?.brands ?? stats?.brands_detected ?? "—"}
          hint="con pauta verificada"
        />
        <Stat
          label="PNT en canal"
          value={benchmark?.mentions ?? stats?.mentions ?? "—"}
          hint="apariciones totales"
        />
        <Stat
          label="Share de views"
          value={benchmark?.share_views != null ? `${benchmark.share_views}%` : "—"}
          hint="entre canales capturados"
        />
      </div>
    </div>
  );
}

function ProgramasSection({
  profile,
  chName,
}: {
  profile: ChannelProfile;
  chName: Record<string, string>;
}) {
  const { programs } = profile;
  if (!programs.length) {
    return (
      <p className="text-[14px] text-gray-500">
        Sin programas con apariciones comerciales en el período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {programs.map((p) => (
        <ProgramListCard key={p.video_id} program={p} chName={chName} />
      ))}
    </div>
  );
}

function MarcasSection({ profile }: { profile: ChannelProfile }) {
  const brands = profile.benchmark?.top_brands || [];
  if (!brands.length) {
    return (
      <p className="text-[14px] text-gray-500">
        Sin marcas con pauta verificada en este canal en el período.
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
            <div className="flex justify-between text-[13px] mb-1">
              <Link href={`/marcas/${b.slug}`} className="font-medium hover:text-accent">
                {b.name}
              </Link>
              <span className="text-gray-400 tabular-nums">{b.mentions} apariciones</span>
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
        <Stat label="Apariciones PNT" value={bench?.mentions ?? profile.activations.length} hint="verificadas" />
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

function AudienciaSection({ profile }: { profile: ChannelProfile }) {
  const aud = profile.audience;
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

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Concurrentes prom." value={num(aud.avg_concurrent)} hint="en programas capturados" />
        <Stat label="Pico" value={compact(aud.peak_concurrent)} hint="un minuto del vivo" />
        <Stat
          label="Cobertura chat"
          value={aud.chat_coverage != null ? `${aud.chat_coverage}%` : "—"}
          hint="de programas"
        />
        <Stat
          label="Engagement"
          value={aud.chat_msgs_per_1k_min != null ? aud.chat_msgs_per_1k_min : "s/d"}
          hint="msgs / 1k concurrentes"
        />
      </div>
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
    </div>
  );
}

function ComparacionesSection({
  profile,
  allBenchmark,
}: {
  profile: ChannelProfile;
  allBenchmark: ChannelBenchmark[];
}) {
  const currentId = profile.config.id;
  const maxShare = Math.max(...allBenchmark.map((b) => b.share_views || 0), 1);
  const maxBrands = Math.max(...allBenchmark.map((b) => b.brands || 0), 1);
  const maxAvg = Math.max(...allBenchmark.map((b) => b.avg_concurrent || 0), 1);

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
              <th className="text-right">En vivo</th>
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

export default function ChannelProfileSections({ tab, profile, allBenchmark, chName }: Props) {
  switch (tab) {
    case "descripcion":
      return <DescripcionSection profile={profile} />;
    case "programas":
      return <ProgramasSection profile={profile} chName={chName} />;
    case "marcas":
      return <MarcasSection profile={profile} />;
    case "actividad":
      return <ActividadSection profile={profile} />;
    case "audiencia":
      return <AudienciaSection profile={profile} />;
    case "comparaciones":
      return <ComparacionesSection profile={profile} allBenchmark={allBenchmark} />;
    case "evidencia":
      return <EvidenciaSection profile={profile} />;
    default:
      return null;
  }
}
