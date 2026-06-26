import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  hasFullPlatformAccess,
} from "@/lib/admin-auth";
import {
  OPS_COOKIE,
  OPS_LOGIN_PATH,
  isOpsAuthenticated,
  isOpsProtectedPath,
  opsSessionValid,
} from "@/lib/ops-auth";
import {
  PARTNER_COOKIE,
  PARTNER_LOGIN_PATH,
  isPartnerBlockedPath,
  isPartnerGated,
  isPartnerPublicPath,
  marcasSlugFromPath,
  partnerCanViewSlug,
  partnerLandingPath,
  partnerSessionValid,
} from "@/lib/partner-auth";
import { isAccessLinkExpired } from "@/lib/partner-invite";
import { getPartnerById, getPartnerByAccessToken } from "@/lib/partners-store";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Backoffice (operación interna) ---
  if (pathname === OPS_LOGIN_PATH || pathname.startsWith("/backoffice")) {
    if (!isOpsProtectedPath(pathname)) return NextResponse.next();

    const password = process.env.BACK_OFFICE_PASSWORD;
    if (!password) {
      const login = new URL(OPS_LOGIN_PATH, req.url);
      login.searchParams.set("from", pathname);
      login.searchParams.set("err", "config");
      return NextResponse.redirect(login);
    }
    const cookie = req.cookies.get(OPS_COOKIE)?.value;
    if (await opsSessionValid(cookie, password)) return NextResponse.next();
    const login = new URL(OPS_LOGIN_PATH, req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  // --- Link de acceso cliente: /acceso/entrar/{token} → sesión scoped ---
  const entrarMatch = pathname.match(/^\/acceso\/entrar\/([^/]+)$/);
  if (entrarMatch) {
    if (!isPartnerGated()) {
      return NextResponse.redirect(new URL("/marcas", req.url));
    }

    const opsCookie = req.cookies.get(OPS_COOKIE)?.value;
    const opsPassword = process.env.BACK_OFFICE_PASSWORD;
    if (opsCookie && opsPassword && (await opsSessionValid(opsCookie, opsPassword))) {
      const bo = new URL("/backoffice", req.url);
      bo.searchParams.set("tab", "clientes");
      bo.searchParams.set("err", "client-link");
      return NextResponse.redirect(bo);
    }

    const partner = await getPartnerByAccessToken(entrarMatch[1]);
    if (
      partner?.active !== false &&
      partner.invite_token_hash &&
      !isAccessLinkExpired(partner.invite_expires_at)
    ) {
      const res = NextResponse.redirect(
        new URL(partnerLandingPath(partner), req.url)
      );
      res.cookies.set(PARTNER_COOKIE, `${partner.id}.${partner.invite_token_hash}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    const login = new URL(PARTNER_LOGIN_PATH, req.url);
    login.searchParams.set("err", "link");
    return NextResponse.redirect(login);
  }

  // --- Design partners (plataforma comercial) ---
  if (!isPartnerGated()) return NextResponse.next();

  if (isPartnerPublicPath(pathname)) return NextResponse.next();

  // Operador admin o backoffice → vista completa (sin scope de cliente)
  const adminCookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const opsCookie = req.cookies.get(OPS_COOKIE)?.value;
  if (await hasFullPlatformAccess(adminCookie, opsCookie, isOpsAuthenticated)) {
    return NextResponse.next();
  }

  const partnerCookie = req.cookies.get(PARTNER_COOKIE)?.value;
  const session = await partnerSessionValid(partnerCookie);
  if (!session) {
    const login = new URL(PARTNER_LOGIN_PATH, req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (isPartnerBlockedPath(pathname)) {
    return NextResponse.redirect(new URL("/marcas", req.url));
  }

  const marcaSlug = marcasSlugFromPath(pathname);
  if (marcaSlug) {
    const partner = await getPartnerById(session.id);
    if (partner && !partnerCanViewSlug(partner, marcaSlug)) {
      return NextResponse.redirect(new URL("/marcas?err=scope", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
