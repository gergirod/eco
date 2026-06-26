import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCredentials,
  adminSessionToken,
  verifyAdminLogin,
} from "@/lib/admin-auth";
import { PARTNER_COOKIE } from "@/lib/partner-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminCredentials()) {
    return NextResponse.json(
      { ok: false, error: "Admin no configurado (ECO_ADMIN_USERNAME / ECO_ADMIN_PASSWORD)" },
      { status: 503 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "Completá usuario y contraseña" },
      { status: 400 }
    );
  }

  if (!(await verifyAdminLogin(username, password))) {
    return NextResponse.json(
      { ok: false, error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const token = await adminSessionToken(username, password);
  const res = NextResponse.json({ ok: true, role: "admin" });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  // Sesión admin reemplaza scope de cliente si existía
  res.cookies.set(PARTNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
