import { NextResponse } from "next/server";
import { isInviteExpired } from "@/lib/partner-invite";
import { partnerCompetitorSlugs } from "@/lib/partners";
import { getPartnerByInviteToken } from "@/lib/partners-store";

type RouteParams = { params: { token: string } };

export async function GET(_req: Request, { params }: RouteParams) {
  const token = params.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 400 });
  }

  const partner = await getPartnerByInviteToken(token);
  if (!partner || partner.active === false || !partner.invite_token_hash) {
    return NextResponse.json(
      { ok: false, error: "Invitación inválida o ya usada." },
      { status: 404 }
    );
  }

  if (isInviteExpired(partner.invite_expires_at)) {
    return NextResponse.json(
      { ok: false, error: "Esta invitación expiró.", expired: true },
      { status: 410 }
    );
  }

  return NextResponse.json({
    ok: true,
    partnerName: partner.name,
    brandSlugs: partner.brand_slugs,
    competitorSlugs: partnerCompetitorSlugs(partner),
    expiresAt: partner.invite_expires_at,
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const token = params.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 400 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const password = body.password || "";
  const { acceptPartnerInvite } = await import("@/lib/partners-store");
  const { partnerSessionToken, PARTNER_COOKIE } = await import("@/lib/partner-auth");

  const result = await acceptPartnerInvite(token, password);
  if (!result.ok || !result.partner) {
    return NextResponse.json(
      { ok: false, error: result.error || "No se pudo activar la cuenta" },
      { status: 400 }
    );
  }

  const sessionToken = await partnerSessionToken(result.partner.id, password);
  const res = NextResponse.json({
    ok: true,
    partner: {
      id: result.partner.id,
      name: result.partner.name,
      brand_slugs: result.partner.brand_slugs,
      competitor_slugs: partnerCompetitorSlugs(result.partner),
    },
  });
  res.cookies.set(PARTNER_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
