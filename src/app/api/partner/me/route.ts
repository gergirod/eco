import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PARTNER_COOKIE,
  accessMode,
  partnerSessionValid,
} from "@/lib/partner-auth";

export async function GET() {
  const mode = accessMode();
  if (mode === "open") {
    return NextResponse.json({ ok: true, mode, partner: null });
  }

  const session = await partnerSessionValid(cookies().get(PARTNER_COOKIE)?.value);
  return NextResponse.json({
    ok: true,
    mode,
    partner: session,
  });
}
