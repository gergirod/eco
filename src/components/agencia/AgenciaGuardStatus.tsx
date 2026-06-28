import type { GuardStatus } from "@/lib/agencia-guard";

type Props = {
  status: GuardStatus;
};

export default function AgenciaGuardStatus({ status }: Props) {
  if (!status.active) {
    return (
      <div className="card p-5 border-amber-200 bg-amber-50">
        <p className="text-[14px] text-amber-900">Sin marcas en monitoreo — configurá tu portfolio.</p>
      </div>
    );
  }

  return (
    <div className="card p-5 border border-green-200 bg-gradient-to-r from-[#f0fff4] to-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-[11px] uppercase tracking-wide font-semibold text-green-800">
              ECO Guard · Monitoreo activo
            </span>
          </div>
          <p className="text-[14px] text-ink font-medium">
            {status.brandCount} marca{status.brandCount !== 1 ? "s" : ""} ·{" "}
            {status.competitorCount} competidor{status.competitorCount !== 1 ? "es" : ""} ·{" "}
            <span className="tabular-nums">{status.pntThisWeek} PNT</span> detectadas
          </p>
          <p className="text-[12px] text-gray-500 mt-1">
            Última captura: {status.lastCaptureLabel} · te avisamos por WhatsApp cuando sale tu PNT
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status.brandsMonitored.map((b) => (
            <span
              key={b.slug}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-green-200 text-green-900"
            >
              {b.name} · {b.mentions} PNT
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
