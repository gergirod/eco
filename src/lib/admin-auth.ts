/** Login admin ECO — vista completa de plataforma (sin scope de cliente). */

export const ADMIN_COOKIE = "eco_admin_session";

export type AdminCredentials = {
  username: string;
  password: string;
};

export function adminCredentials(): AdminCredentials | null {
  const username = process.env.ECO_ADMIN_USERNAME?.trim();
  const password = process.env.ECO_ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export async function adminSessionToken(
  username: string,
  password: string
): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`eco-admin:${username}:${password}`)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function adminSessionValid(
  cookieValue: string | undefined
): Promise<boolean> {
  const creds = adminCredentials();
  if (!cookieValue || !creds) return false;
  const expected = await adminSessionToken(creds.username, creds.password);
  return cookieValue === expected;
}

export async function verifyAdminLogin(
  username: string,
  password: string
): Promise<boolean> {
  const creds = adminCredentials();
  if (!creds) return false;
  return username.trim() === creds.username && password === creds.password;
}

/** Admin u operador backoffice → plataforma sin restricciones de cliente */
export async function hasFullPlatformAccess(
  adminCookie: string | undefined,
  opsCookie: string | undefined,
  isOpsAuth: (c: string | undefined) => Promise<boolean>
): Promise<boolean> {
  if (await adminSessionValid(adminCookie)) return true;
  return isOpsAuth(opsCookie);
}
