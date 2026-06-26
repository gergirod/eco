import { NextResponse } from "next/server";
import { buildAccessUrl, parseAccessMonths, accessLinkExpiresAt } from "@/lib/partner-invite";
import { requireOpsAuth } from "@/lib/ops-api-auth";
import {
  listPartners,
  partnerHasAccessLink,
  partnersStoreMode,
  upsertPartner,
  type UpsertPartnerInput,
} from "@/lib/partners-store";
import { partnerCompetitorSlugs } from "@/lib/partners";

export async function GET() {
  if (!(await requireOpsAuth())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const partners = await listPartners();
  return NextResponse.json({
    ok: true,
    mode: partnersStoreMode(),
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      brand_slugs: p.brand_slugs,
      competitor_slugs: partnerCompetitorSlugs(p),
      competitor_by_brand: p.competitor_by_brand || {},
      active: p.active !== false,
      contact_email: p.contact_email,
      notes: p.notes,
      has_password: Boolean(p.password_hash),
      pending_invite: partnerHasAccessLink(p),
      invite_expires_at: p.invite_expires_at,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireOpsAuth())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: UpsertPartnerInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!body.id?.trim() || !body.name?.trim() || !body.brand_slugs?.length) {
    return NextResponse.json(
      { ok: false, error: "id, name y brand_slugs son obligatorios" },
      { status: 400 }
    );
  }

  const accessMonths = parseAccessMonths(body.access_months);
  const origin = new URL(req.url).origin;
  const result = await upsertPartner({
    ...body,
    id: body.id.trim(),
    name: body.name.trim(),
    access_months: accessMonths,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    accessUrl: result.inviteToken ? buildAccessUrl(result.inviteToken, origin) : undefined,
    accessExpiresAt: result.inviteToken ? accessLinkExpiresAt(accessMonths) : undefined,
  });
}
