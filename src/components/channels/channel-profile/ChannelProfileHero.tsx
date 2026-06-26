import Link from "next/link";
import { Badge } from "@/components/ui";
import EntityCoverageLine from "@/components/EntityCoverageLine";
import { ATTENTION_DEFINITION, channelEntityCoverage, formatAttentionLiveStats } from "@/lib/coverage";
import { compact } from "@/lib/format";
import type { ChannelProfile } from "@/lib/channelProfile";

type Props = {
  profile: ChannelProfile;
};

export default function ChannelProfileHero({ profile }: Props) {
  const { config, audience, benchmark } = profile;
  const topProgram = audience?.top_programs?.[0];
  const topBrand = benchmark?.top_brands?.[0];

  const attentionLine = audience
    ? formatAttentionLiveStats(audience.avg_concurrent, audience.peak_concurrent)
    : null;

  const narrative = audience
    ? benchmark && benchmark.brands > 0
      ? `${config.name} — ${attentionLine}. ${benchmark.brands} marcas con pauta en el período.`
      : `${config.name} — ${attentionLine} en el período capturado.`
    : config.has_data
      ? `${config.name} — monitoreo activo, sin emisiones con atención medida en el período actual.`
      : `${config.name} — canal configurado, sin captura reciente.`;

  const entityCoverage = channelEntityCoverage(profile);

  return (
    <section className="mb-4">
      <div className="rounded-2xl border border-[#ececec] bg-gradient-to-br from-gray-50/80 via-white to-white p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">
          Perfil del canal
        </p>
        <p className="text-[17px] sm:text-[20px] font-medium text-ink leading-snug tracking-tight mb-3 max-w-2xl">
          {narrative}
        </p>
        <p className="text-[13px] text-gray-500 mb-4 max-w-2xl leading-relaxed">{ATTENTION_DEFINITION}</p>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-gray-600 mb-5">
          {config.genre && (
            <span>
              <span className="text-gray-400">Género · </span>
              {config.genre}
            </span>
          )}
          {config.subscribers && (
            <span>
              <span className="text-gray-400">Suscriptores · </span>
              {config.subscribers}
            </span>
          )}
          {config.stats?.last_processed && (
            <span>
              <span className="text-gray-400">Última captura · </span>
              {config.stats.last_processed}
            </span>
          )}
          {config.pipeline_status && (
            <Badge tone={config.pipeline_status === "activo" ? "green" : "gray"}>
              {config.pipeline_status}
            </Badge>
          )}
        </div>

        {topProgram && (
          <p className="text-[13px] text-gray-500 mb-4">
            Programa con mayor pico de atención ·{" "}
            <span className="text-gray-700 line-clamp-1">{topProgram.title}</span>
            {" · "}
            <span className="font-medium text-ink">{compact(topProgram.peak)} mirando</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {topBrand && (
            <Link
              href={`/marcas/${topBrand.slug}?channel=${profile.config.id}`}
              className="btn btn-primary"
            >
              Investigar {topBrand.name}
            </Link>
          )}
          {config.url && (
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-[#ececec] text-[13px]"
            >
              Ver en YouTube ↗
            </a>
          )}
        </div>
      </div>
      {entityCoverage ? <EntityCoverageLine text={entityCoverage} className="mb-0 mt-4" /> : null}
    </section>
  );
}
