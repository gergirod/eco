import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminSessionValid } from "@/lib/admin-auth";
import { OPS_COOKIE, opsSessionValid } from "@/lib/ops-auth";

/** API backoffice — admin ECO (login en /acceso) o legacy ops cookie */
export async function requireOpsAuth(): Promise<boolean> {
  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;
  if (await adminSessionValid(adminCookie)) return true;

  const password = process.env.BACK_OFFICE_PASSWORD;
  if (!password) return false;
  const cookie = cookies().get(OPS_COOKIE)?.value;
  return opsSessionValid(cookie, password);
}
