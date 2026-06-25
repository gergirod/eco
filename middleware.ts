import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OPS_COOKIE,
  OPS_LOGIN_PATH,
  isOpsProtectedPath,
  opsSessionValid,
} from "@/lib/ops-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isOpsProtectedPath(pathname)) return NextResponse.next();

  const password = process.env.BACK_OFFICE_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
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

export const config = {
  matcher: ["/backoffice/:path*"],
};
