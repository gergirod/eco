/**
 * Copy de cobertura del corpus — plataforma vs entidad (SPEC-004).
 */

import type { ChannelProfile } from "./channelProfile";
import type { DiscoveryAdvertiser, DiscoveryPlatformCoverage } from "./discovery";

export function formatCaptureDate(iso: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

/** Línea global bajo el hero de cada módulo de inteligencia. */
export function platformCoverageText(coverage: DiscoveryPlatformCoverage): string {
  const parts: string[] = [
    `${coverage.channelsCovered} ${coverage.channelsCovered === 1 ? "canal" : "canales"}`,
  ];

  if (coverage.periodDays && coverage.periodDays > 0) {
    parts.push(`~${coverage.periodDays} ${coverage.periodDays === 1 ? "día" : "días"}`);
  }

  if (coverage.programsWithViewers > 0) {
    parts.push(
      `${coverage.programsWithViewers} ${
        coverage.programsWithViewers === 1 ? "programa" : "programas"
      }`
    );
  }

  parts.push(`${formatHours(coverage.hoursCaptured)} capturadas`);

  if (
    coverage.firstCapture &&
    coverage.lastCapture &&
    coverage.firstCapture !== coverage.lastCapture
  ) {
    parts.push(
      `${formatCaptureDate(coverage.firstCapture)} – ${formatCaptureDate(coverage.lastCapture)}`
    );
  } else if (coverage.lastCapture) {
    parts.push(`al ${formatCaptureDate(coverage.lastCapture)}`);
  }

  return parts.join(" · ");
}

/** Cobertura scoped a un canal. */
export function channelEntityCoverage(profile: ChannelProfile): string | null {
  const { audience, benchmark } = profile;
  if (!audience && !benchmark) return null;

  const programs = audience?.videos ?? benchmark?.videos ?? 0;
  if (!programs && !benchmark?.mentions) return null;

  const parts: string[] = [];
  if (programs > 0) {
    parts.push(`${programs} ${programs === 1 ? "programa" : "programas"} capturados en este canal`);
  }
  if (audience?.chat_coverage != null && audience.chat_coverage > 0) {
    parts.push(`chat en ${audience.chat_coverage}% de emisiones`);
  } else if (audience && audience.chat_coverage === 0) {
    parts.push("sin chat capturado en el período");
  }
  if (benchmark && benchmark.brands > 0) {
    parts.push(
      `${benchmark.brands} ${benchmark.brands === 1 ? "marca" : "marcas"} · ${benchmark.mentions} apariciones`
    );
  }

  return parts.length ? parts.join(" · ") : null;
}

/** Cobertura scoped a una marca. */
export function brandEntityCoverage(advertiser: DiscoveryAdvertiser): string {
  const parts: string[] = [
    `${advertiser.activationCount} ${
      advertiser.activationCount === 1 ? "aparición" : "apariciones"
    } en ${advertiser.channelCount} ${
      advertiser.channelCount === 1 ? "canal" : "canales"
    }`,
    `${advertiser.programCount} ${
      advertiser.programCount === 1 ? "programa" : "programas"
    } distintos`,
  ];

  if (advertiser.firstSeen) {
    const range =
      advertiser.lastSeen && advertiser.lastSeen !== advertiser.firstSeen
        ? `${advertiser.firstSeen} – ${advertiser.lastSeen}`
        : advertiser.firstSeen;
    parts.push(range);
  }

  return parts.join(" · ");
}
