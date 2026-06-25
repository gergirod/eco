import type { DiscoveryPlatformCoverage } from "@/lib/discovery";

function formatCaptureDate(iso: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

function formatCount(n: number): string {
  return (n ?? 0).toLocaleString("es-AR");
}

type DiscoveryCoverageProps = {
  coverage: DiscoveryPlatformCoverage;
};

export default function DiscoveryCoverage({ coverage }: DiscoveryCoverageProps) {
  const programsGap =
    coverage.totalProgramsInCorpus != null
      ? Math.max(0, coverage.totalProgramsInCorpus - coverage.programsWithViewers)
      : null;

  return (
    <footer
      className="mt-14 py-6 px-5 sm:px-6 rounded-xl bg-[#f7f7f8] text-[12.5px] text-gray-500 leading-relaxed"
      aria-label="Cobertura de observación"
    >
      <p>
        Observamos <strong className="text-gray-700 font-medium">{formatCount(coverage.channelsCovered)}</strong>{" "}
        {coverage.channelsCovered === 1 ? "canal" : "canales"} del streaming argentino ·{" "}
        <strong className="text-gray-700 font-medium">{formatHours(coverage.hoursCaptured)}</strong>{" "}
        de emisión registradas · última actualización{" "}
        <strong className="text-gray-700 font-medium">{formatCaptureDate(coverage.lastCapture)}</strong>
        {programsGap != null && programsGap > 0 && (
          <>
            .{" "}
            {programsGap.toLocaleString("es-AR")} emisiones sin medición de audiencia minuto a minuto.
          </>
        )}
      </p>
    </footer>
  );
}
