/** Link de acceso único por cliente — validez en meses (0 = sin vencimiento). */

export function generateAccessToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** @deprecated alias */
export const generateInviteToken = generateAccessToken;

export async function hashAccessToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`eco-invite:${token}`)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** @deprecated alias */
export const hashInviteToken = hashAccessToken;

/** Meses de validez; 0 o null = link sin vencimiento. */
export function accessLinkExpiresAt(months?: number | null, from = new Date()): string | null {
  const n = months == null ? 0 : Math.floor(months);
  if (n <= 0) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

/** Suma meses al vencimiento actual (o desde hoy si ya venció) — renovación por pago. */
export function extendAccessExpiry(
  months: number,
  currentExpires: string | null | undefined
): string | null {
  const n = Math.floor(months);
  if (n <= 0) return null;
  const base =
    currentExpires && !isAccessLinkExpired(currentExpires)
      ? new Date(currentExpires)
      : new Date();
  return accessLinkExpiresAt(n, base);
}

/** @deprecated alias */
export const inviteExpiresAt = accessLinkExpiresAt;

export function isAccessLinkExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return Date.now() > Date.parse(expiresAt);
}

/** @deprecated alias */
export const isInviteExpired = isAccessLinkExpired;

export function formatAccessExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "Sin vencimiento";
  try {
    return new Date(expiresAt).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return expiresAt;
  }
}

export function buildAccessUrl(token: string, origin?: string): string {
  const base =
    origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base}/acceso/entrar/${token}`;
}

/** @deprecated alias */
export const buildInviteUrl = buildAccessUrl;

export function parseAccessMonths(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
