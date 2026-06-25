/** Campañas — helpers de UI (sin lógica de negocio). */

export type EvidenceLevel =
  | "VERIFIED"
  | "PARTIAL_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE";

export const EVIDENCE_ORDER: EvidenceLevel[] = [
  "VERIFIED",
  "PARTIAL_EVIDENCE",
  "INSUFFICIENT_EVIDENCE",
];

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  VERIFIED: "Respaldo completo",
  PARTIAL_EVIDENCE: "Respaldo parcial",
  INSUFFICIENT_EVIDENCE: "Respaldo insuficiente",
};

export const EVIDENCE_SHORT: Record<EvidenceLevel, string> = {
  VERIFIED: "Completo",
  PARTIAL_EVIDENCE: "Parcial",
  INSUFFICIENT_EVIDENCE: "Insuficiente",
};

export const EVIDENCE_COLOR: Record<EvidenceLevel, string> = {
  VERIFIED: "#0f7d6b",
  PARTIAL_EVIDENCE: "#b8862b",
  INSUFFICIENT_EVIDENCE: "#c45c4a",
};

export function evidenceLabel(level: string | undefined): string {
  if (level && level in EVIDENCE_LABEL) return EVIDENCE_LABEL[level as EvidenceLevel];
  return "Sin clasificar";
}

export function evidenceTone(level: string | undefined): "green" | "amber" | "red" | "gray" {
  if (level === "VERIFIED") return "green";
  if (level === "PARTIAL_EVIDENCE") return "amber";
  if (level === "INSUFFICIENT_EVIDENCE") return "red";
  return "gray";
}

export function campaignReportKey(slug: string): string {
  return slug.startsWith("campaign-") ? slug : `campaign-${slug}`;
}

export function formatScopeDate(iso: string): string {
  if (!iso || iso.length !== 8) return iso || "—";
  return `${iso.slice(6, 8)}/${iso.slice(4, 6)}/${iso.slice(0, 4)}`;
}

export function formatScopePeriod(desde: string, hasta: string): string {
  const a = formatScopeDate(desde);
  const b = formatScopeDate(hasta);
  return a === b ? a : `${a} – ${b}`;
}

export function isCampaignReport(report: { kind?: string } | null | undefined): boolean {
  return report?.kind === "campaign";
}

export function listCampaignReports(reports: Record<string, any>) {
  return Object.entries(reports)
    .filter(([, r]) => isCampaignReport(r))
    .map(([key, r]) => ({
      key,
      slug: r.campaign_slug || key.replace(/^campaign-/, ""),
      name: r.scope?.marca || r.name,
      mentions: r.mentions ?? r.detail?.length ?? 0,
      scope: r.scope,
      summary: r.summary,
    }))
    .sort((a, b) => b.mentions - a.mentions);
}

/** Resuelve el slug de marca (Discovery) para una campaña publicada. */
export function findAdvertiserSlugForCampaign(
  campaignSlug: string,
  reports: Record<string, any>,
  brands: { slug: string; name: string }[]
): string | null {
  const key = campaignReportKey(campaignSlug);
  const report = reports[key];
  const marca = (report?.scope?.marca || report?.name || "").trim().toLowerCase();
  if (marca) {
    const exact = brands.find((b) => b.name.trim().toLowerCase() === marca);
    if (exact) return exact.slug;
  }
  const prefix = campaignSlug.split("-")[0];
  if (prefix) {
    const byPrefix = brands.find((b) => b.slug.startsWith(prefix));
    if (byPrefix) return byPrefix.slug;
  }
  return null;
}

/** Resuelve la campaña publicada asociada a una marca (si existe). */
export function findCampaignSlugForAdvertiser(
  advertiserSlug: string,
  advertiserName: string,
  reports: Record<string, any>
): string | null {
  const campaigns = listCampaignReports(reports);
  const nameLower = advertiserName.trim().toLowerCase();
  const slugPrefix = advertiserSlug.split("-")[0];

  for (const c of campaigns) {
    const marca = (c.scope?.marca || c.name || "").trim().toLowerCase();
    if (marca && marca === nameLower) return c.slug;
    if (slugPrefix && c.slug.startsWith(slugPrefix)) return c.slug;
  }
  return null;
}

/** Veredicto comercial en prosa — SPEC-005. */
export function buildCampaignVerdict(report: {
  scope?: { marca?: string };
  name?: string;
  mentions?: number;
  detail?: unknown[];
  summary?: { by_evidence?: Record<string, number> };
}): string {
  const brand = report.scope?.marca || report.name || "La marca";
  const total = report.mentions ?? report.detail?.length ?? 0;
  if (!total) {
    return `${brand} — sin apariciones detectadas en el período de pauta acordado.`;
  }

  const by = report.summary?.by_evidence || {};
  const verified = by.VERIFIED || 0;
  const partial = by.PARTIAL_EVIDENCE || 0;
  const insufficient = by.INSUFFICIENT_EVIDENCE || 0;

  if (verified === total) {
    return `${brand} — ${verified} de ${total} apariciones con respaldo completo. La campaña se sostiene.`;
  }
  if (verified > 0 && !partial && !insufficient) {
    return `${brand} — ${verified} de ${total} apariciones con respaldo completo.`;
  }

  const parts: string[] = [];
  if (verified) parts.push(`${verified} con respaldo completo`);
  if (partial) parts.push(`${partial} con respaldo parcial`);
  if (insufficient) parts.push(`${insufficient} con respaldo insuficiente`);

  return `${brand} — ${total} apariciones detectadas: ${parts.join(", ")}.`;
}
