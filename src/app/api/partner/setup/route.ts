import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PARTNER_COOKIE,
  partnerSessionValid,
} from "@/lib/partner-auth";
import { pairsToPartnerPayload, type BrandPair } from "@/lib/brand-catalog";
import { updatePartnerPortfolio } from "@/lib/partners-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await partnerSessionValid(cookies().get(PARTNER_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesión requerida" }, { status: 401 });
  }

  let body: { pairs?: BrandPair[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const pairs = body.pairs || [];
  const { brand_slugs, competitor_by_brand } = pairsToPartnerPayload(pairs);

  if (!brand_slugs.length) {
    return NextResponse.json(
      { ok: false, error: "Elegí al menos una marca del cliente." },
      { status: 400 }
    );
  }

  const result = await updatePartnerPortfolio(
    session.id,
    brand_slugs,
    competitor_by_brand
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    partner: {
      id: result.partner?.id,
      name: result.partner?.name,
      brand_slugs: result.partner?.brand_slugs,
      competitor_slugs: result.partner?.competitor_slugs,
    },
  });
}
