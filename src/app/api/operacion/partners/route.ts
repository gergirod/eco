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
      icp: p.icp,
      plan: p.plan,
      brand_slugs: p.brand_slugs,
      competitor_slugs: partnerCompetitorSlugs(p),
      competitor_by_brand: p.competitor_by_brand || {},
      channel_ids: p.channel_ids || [],
      benchmark_channel_ids: p.benchmark_channel_ids || [],
      active: p.active !== false,
      contact_email: p.contact_email,
      notes: p.notes,
      price_ars_month: p.price_ars_month,
      contract_started_at: p.contract_started_at,
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

  if (!body.id?.trim() || !body.name?.trim()) {
    return NextResponse.json(
      { ok: false, error: "id y name son obligatorios" },
      { status: 400 }
    );
  }

  const icp = body.icp || "agencia";
  if (icp !== "canal" && !body.brand_slugs?.length) {
    return NextResponse.json(
      { ok: false, error: "brand_slugs son obligatorios para agencia/marca" },
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
