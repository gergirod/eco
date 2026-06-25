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

type CoverageLineProps = {
  coverage: DiscoveryPlatformCoverage;
};

/** Una línea de cobertura bajo el hero — sin footer operativo. */
export default function CoverageLine({ coverage }: CoverageLineProps) {
  return (
    <p className="text-[12px] text-gray-400 mb-8 leading-relaxed" aria-label="Cobertura del período">
      {coverage.channelsCovered}{" "}
      {coverage.channelsCovered === 1 ? "canal" : "canales"} · {formatHours(coverage.hoursCaptured)}{" "}
      de emisión · actualizado {formatCaptureDate(coverage.lastCapture)}
    </p>
  );
}
