/** Auth interna: sección Operación (backoffice, runbook, casos). */

export const OPS_COOKIE = "eco_ops_session";

export async function opsSessionToken(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`eco-ops:${password}`)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function opsSessionValid(
  cookieValue: string | undefined,
  password: string | undefined
): Promise<boolean> {
  if (!cookieValue || !password) return false;
  return cookieValue === (await opsSessionToken(password));
}

/** Operador logueado en backoffice — bypass del gate de clientes (SPEC-010). */
export async function isOpsAuthenticated(
  cookieValue: string | undefined
): Promise<boolean> {
  const password = process.env.BACK_OFFICE_PASSWORD;
  if (!password) return false;
  return opsSessionValid(cookieValue, password);
}

export const OPS_PROTECTED_PREFIXES = ["/backoffice"] as const;
export const OPS_LOGIN_PATH = "/backoffice/login";

export function isOpsProtectedPath(pathname: string): boolean {
  if (pathname === OPS_LOGIN_PATH) return false;
  return OPS_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
