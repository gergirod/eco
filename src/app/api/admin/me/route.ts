import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValid } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await adminSessionValid(cookies().get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ ok: true, isAdmin });
}
