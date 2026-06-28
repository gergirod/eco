import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import type { DondeRubroPack } from "@/lib/agencia-donde";
import { compact, vodLink } from "@/lib/format";

type Props = {
  pack: DondeRubroPack;
};

function ActionCard({
  tone,
  label,
  channel,
  program,
  detail,
  videoId,
  tSeconds,
}: {
  tone: "good" | "bad" | "neutral";
  label: string;
  channel: string;
  program: string;
  detail: string;
  videoId?: string;
  tSeconds?: number;
}) {
  const styles = {
    good: "border-green-200 bg-green-50/40",
    bad: "border-amber-200 bg-amber-50/50",
    neutral: "border-[#ececec] bg-white",
  };

  return (
    <article className={`rounded-xl border p-4 ${styles[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-[14px] font-semibold text-ink">{channel}</p>
      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{program}</p>
      <p className="text-[13px] text-gray-700 mt-2">{detail}</p>
      {videoId && (
        <a
          href={vodLink(videoId, tSeconds ?? 0)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[12px] text-accent font-medium hover:underline"
        >
          Ver en YouTube ↗
        </a>
      )}
    </article>
  );
}

export default function AgenciaDondeCliente({ pack }: Props) {
  const hasActions =
    pack.repeatSlots.length > 0 ||
    pack.avoidSlots.length > 0 ||
    pack.opportunities.length > 0 ||
    pack.competitorSlots.length > 0;

  if (!hasActions) {
    return (
      <p className="text-[13px] text-gray-500">
        {pack.clientBrand} no tuvo placas esta semana — mirá las oportunidades del rubro arriba.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[14px] font-semibold text-ink">{pack.clientBrand}</p>
        {pack.competitorName && (
          <Link
            href={`${AGENCIA_BASE}/pulso`}
            className="text-[12px] text-accent hover:underline"
          >
            vs {pack.competitorName} →
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {pack.repeatSlots.slice(0, 2).map((s, i) => (
          <ActionCard
            key={`r-${i}`}
            tone="good"
            label="Repetir · ya rindió"
            channel={s.channelName}
            program={s.program}
            detail={`${compact(s.concAt)} mirando · ${s.peakPct ?? "—"}% del pico`}
            videoId={s.videoId}
            tSeconds={s.tSeconds}
          />
        ))}
        {pack.avoidSlots.slice(0, 2).map((s, i) => (
          <ActionCard
            key={`a-${i}`}
            tone="bad"
            label="No repetir · salió flojo"
            channel={s.channelName}
            program={s.program}
            detail={`Solo ${compact(s.concAt)} mirando · ${s.peakPct ?? "—"}% del pico`}
            videoId={s.videoId}
            tSeconds={s.tSeconds}
          />
        ))}
        {pack.opportunities.slice(0, 1).map((o) => (
          <ActionCard
            key={o.id}
            tone="neutral"
            label="Probar acá"
            channel={o.channelName}
            program={o.showName}
            detail={`${o.gapLabel} · pico ${compact(o.peakAttention)} mirando`}
          />
        ))}
        {pack.competitorSlots.slice(0, 1).map((s, i) => (
          <ActionCard
            key={`c-${i}`}
            tone="neutral"
            label={`Dónde pauta ${pack.competitorName}`}
            channel={s.channelName}
            program={s.program}
            detail={`${compact(s.concAt)} mirando cuando salió`}
            videoId={s.videoId}
            tSeconds={s.tSeconds}
          />
        ))}
      </div>
    </div>
  );
}
