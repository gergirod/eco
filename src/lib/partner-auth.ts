/** Auth de design partners — acceso scoped a marcas del contrato. */

import type { PartnerRecord } from "@/lib/partners";
import { normalizePartnerIcp, normalizePartnerPlan, partnerCompetitorSlugs } from "@/lib/partners";
import { getPartnerById } from "@/lib/partners-store";

export const PARTNER_COOKIE = "eco_partner_session";

export type PartnerSession = {
  id: string;
  name: string;
  icp: PartnerRecord["icp"];
  plan: PartnerRecord["plan"];
  brand_slugs: string[];
  competitor_slugs: string[];
  channel_ids?: string[];
  benchmark_channel_ids?: string[];
};

export function partnerToSession(partner: PartnerRecord): PartnerSession {
  const icp = normalizePartnerIcp(partner.icp);
  return {
    id: partner.id,
    name: partner.name,
    icp,
    plan: normalizePartnerPlan(partner.plan, icp),
    brand_slugs: partner.brand_slugs,
    competitor_slugs: partnerCompetitorSlugs(partner),
    channel_ids: partner.channel_ids,
    benchmark_channel_ids: partner.benchmark_channel_ids,
  };
}

/** Landing post-login por ICP — SPEC-010 §5.3 */
export function partnerLandingPath(
  partner: Pick<PartnerRecord, "icp" | "brand_slugs" | "channel_ids">
): string {
  const icp = normalizePartnerIcp(partner.icp);
  if (icp === "canal" && partner.channel_ids?.[0]) {
    return `/canales/${partner.channel_ids[0]}`;
  }
  if (icp === "marca" && partner.brand_slugs[0]) {
    return `/marcas/${partner.brand_slugs[0]}`;
  }
  return "/marcas";
}

export function accessMode(): "open" | "partners" {
  return process.env.ECO_ACCESS_MODE === "partners" ? "partners" : "open";
}

export function isPartnerGated(): boolean {
  return accessMode() === "partners";
}

export function allAllowedSlugs(partner: PartnerRecord): string[] {
  return [...new Set([...partner.brand_slugs, ...partnerCompetitorSlugs(partner)])];
}

/** Legacy env — migrar a Supabase password_hash */
export function parsePartnerPasswords(): Record<string, string> {
  const raw = process.env.ECO_PARTNER_PASSWORDS;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function partnerSessionSuffix(
  partnerId: string,
  password: string
): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`eco-partner:${partnerId}:${password}`)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function partnerSessionToken(
  partnerId: string,
  password: string
): Promise<string> {
  const hex = await partnerSessionSuffix(partnerId, password);
  return `${partnerId}.${hex}`;
}

export function parsePartnerCookie(
  cookieValue: string | undefined
): { partnerId: string; token: string } | null {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return null;
  return {
    partnerId: cookieValue.slice(0, dot),
    token: cookieValue.slice(dot + 1),
  };
}

export async function partnerSessionValid(
  cookieValue: string | undefined
): Promise<PartnerSession | null> {
  const parsed = parsePartnerCookie(cookieValue);
  if (!parsed) return null;

  const partner = await getPartnerById(parsed.partnerId);
  if (!partner || partner.active === false) return null;

  const storedHash = (partner as { password_hash?: string }).password_hash;
  if (storedHash && storedHash === parsed.token) {
    return partnerToSession(partner);
  }

  // Sesión por link de acceso (magic link del cliente)
  const accessHash = (partner as { invite_token_hash?: string | null }).invite_token_hash;
  const accessExpires = (partner as { invite_expires_at?: string | null }).invite_expires_at;
  if (accessHash && accessHash === parsed.token) {
    const { isAccessLinkExpired } = await import("@/lib/partner-invite");
    if (!isAccessLinkExpired(accessExpires)) {
      return partnerToSession(partner);
    }
  }

  // Legacy: ECO_PARTNER_PASSWORDS
  const passwords = parsePartnerPasswords();
  const password = passwords[partner.id];
  if (password) {
    const expected = await partnerSessionToken(partner.id, password);
    if (expected === `${partner.id}.${parsed.token}`) {
      return partnerToSession(partner);
    }
  }

  return null;
}

export function partnerCanViewSlug(
  partner: Pick<PartnerRecord, "brand_slugs" | "competitor_slugs">,
  slug: string
): boolean {
  return allAllowedSlugs(partner as PartnerRecord).includes(slug);
}

export const PARTNER_LOGIN_PATH = "/acceso";

export const PARTNER_PUBLIC_PREFIXES = ["/acceso", "/api/partner", "/api/admin"] as const;

export const PARTNER_BLOCKED_PREFIXES = [
  "/productos",
  "/discover",
  "/competencia",
  "/marca",
  "/audiencia",
  "/mediakit",
  "/certificado",
  "/operacion",
] as const;

export function isPartnerPublicPath(pathname: string): boolean {
  if (pathname === PARTNER_LOGIN_PATH) return true;
  return PARTNER_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isPartnerBlockedPath(pathname: string): boolean {
  return PARTNER_BLOCKED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function marcasSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/marcas\/([^/]+)/);
  return m?.[1] ?? null;
}
