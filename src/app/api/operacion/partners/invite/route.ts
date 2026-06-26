import { NextResponse } from "next/server";
import { buildAccessUrl, parseAccessMonths, accessLinkExpiresAt } from "@/lib/partner-invite";
import { requireOpsAuth } from "@/lib/ops-api-auth";
import { createPartnerInvite } from "@/lib/partners-store";

export async function POST(req: Request) {
  if (!(await requireOpsAuth())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: { id?: string; reset?: boolean; access_months?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obligatorio" }, { status: 400 });
  }

  const { parseAccessMonths } = await import("@/lib/partner-invite");
  const accessMonths = parseAccessMonths(body.access_months);

  const origin = new URL(req.url).origin;
  const result = await createPartnerInvite(id, {
    clearPassword: Boolean(body.reset),
    accessMonths,
  });
  if (!result.ok || !result.inviteToken) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    accessUrl: buildAccessUrl(result.inviteToken, origin),
    accessExpiresAt: accessLinkExpiresAt(accessMonths),
  });
}
