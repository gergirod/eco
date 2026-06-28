import type { GuardStatus } from "@/lib/agencia-guard";

type Props = {
  status: GuardStatus;
  /** Si se pasa, el status se muestra centrado en esa marca */
  brandName?: string;
};

export default function AgenciaGuardStatus({ status, brandName }: Props) {
  if (!status.active) {
    return (
      <div className="card p-5 border-amber-200 bg-amber-50">
        <p className="text-[14px] text-amber-900">
          Elegí una marca para ver placas y alertas.
        </p>
      </div>
    );
  }

  const placasLabel =
    status.pntThisWeek === 1
      ? "1 placa detectada"
      : `${status.pntThisWeek} placas detectadas`;

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
              Esta semana en stream
            </span>
          </div>
          <p className="text-[14px] text-ink font-medium">
            {brandName ? (
              <>
                {brandName} · <span className="tabular-nums">{placasLabel}</span>
              </>
            ) : (
              <>
                {status.brandCount} marca{status.brandCount !== 1 ? "s" : ""} ·{" "}
                <span className="tabular-nums">{placasLabel}</span>
              </>
            )}
            {status.competitorCount > 0 && (
              <span className="text-gray-500 font-normal">
                {" "}
                · rival en monitoreo
              </span>
            )}
          </p>
          <p className="text-[12px] text-gray-500 mt-1">
            Última revisión: {status.lastCaptureLabel} · copiá el mensaje cuando sale la placa
          </p>
        </div>
        {!brandName && status.brandsMonitored.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {status.brandsMonitored.map((b) => (
              <span
                key={b.slug}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-green-200 text-green-900"
              >
                {b.name} · {b.mentions} {b.mentions === 1 ? "placa" : "placas"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
