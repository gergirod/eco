import { NextResponse } from "next/server";
import { OPS_COOKIE, opsSessionToken } from "@/lib/ops-auth";

export async function POST(req: Request) {
  const password = process.env.BACK_OFFICE_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { ok: false, error: "BACK_OFFICE_PASSWORD no configurada en el servidor" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (body.password !== password) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await opsSessionToken(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, token, {
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
  res.cookies.set(OPS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
