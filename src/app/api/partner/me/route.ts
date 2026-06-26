import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValid } from "@/lib/admin-auth";
import {
  PARTNER_COOKIE,
  accessMode,
  partnerSessionValid,
} from "@/lib/partner-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = accessMode();
  const isAdmin = await adminSessionValid(cookies().get(ADMIN_COOKIE)?.value);

  if (mode === "open") {
    return NextResponse.json({ ok: true, mode, partner: null, isAdmin });
  }

  const session = await partnerSessionValid(cookies().get(PARTNER_COOKIE)?.value);
  return NextResponse.json({
    ok: true,
    mode,
    partner: session,
    isAdmin,
  });
}
