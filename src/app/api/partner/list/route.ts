import { NextResponse } from "next/server";
import { listPartners } from "@/lib/partners-store";

export async function GET() {
  const partners = await listPartners();
  const list = partners
    .filter((p) => p.active !== false)
    .map((p) => ({ id: p.id, name: p.name }));
  return NextResponse.json({ ok: true, partners: list });
}
