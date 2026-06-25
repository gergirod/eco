/** Campaign Intelligence — helpers de UI (sin lógica de negocio). */

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
  VERIFIED: "Evidencia completa",
  PARTIAL_EVIDENCE: "Evidencia parcial",
  INSUFFICIENT_EVIDENCE: "Evidencia insuficiente",
};

export const EVIDENCE_SHORT: Record<EvidenceLevel, string> = {
  VERIFIED: "Completa",
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
