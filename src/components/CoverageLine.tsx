import type { DiscoveryPlatformCoverage } from "@/lib/discovery";
import { platformCoverageText } from "@/lib/coverage";

type CoverageLineProps = {
  coverage: DiscoveryPlatformCoverage;
  className?: string;
};

/** Una línea de cobertura del corpus bajo el hero — marco global de la plataforma. */
export default function CoverageLine({ coverage, className = "" }: CoverageLineProps) {
  return (
    <p
      className={`text-[12px] text-gray-400 mb-8 leading-relaxed ${className}`.trim()}
      aria-label="Cobertura del período"
    >
      {platformCoverageText(coverage)}
    </p>
  );
}
