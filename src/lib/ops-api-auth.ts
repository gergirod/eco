import { cookies } from "next/headers";
import { OPS_COOKIE, opsSessionValid } from "@/lib/ops-auth";

export async function requireOpsAuth(): Promise<boolean> {
  const password = process.env.BACK_OFFICE_PASSWORD;
  if (!password) return false;
  const cookie = cookies().get(OPS_COOKIE)?.value;
  return opsSessionValid(cookie, password);
}
