import { NextResponse } from "next/server";
import {
  PARTNER_COOKIE,
  partnerSessionToken,
} from "@/lib/partner-auth";
import { verifyPartnerLogin } from "@/lib/partners-store";

export async function POST(req: Request) {
  let body: { partner_id?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const partnerId = (body.partner_id || "").trim();
  const password = body.password || "";
  if (!partnerId || !password) {
    return NextResponse.json(
      { ok: false, error: "Completá agencia y contraseña" },
      { status: 400 }
    );
  }

  const partner = await verifyPartnerLogin(partnerId, password);
  if (!partner) {
    return NextResponse.json(
      { ok: false, error: "Agencia o contraseña incorrecta" },
      { status: 401 }
    );
  }

  const token = await partnerSessionToken(partnerId, password);
  const res = NextResponse.json({
    ok: true,
    partner: {
      id: partner.id,
      name: partner.name,
      brand_slugs: partner.brand_slugs,
      competitor_slugs: partner.competitor_slugs,
    },
  });
  res.cookies.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARTNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
