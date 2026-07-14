import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const PUBLIC_PATHS = [
  "/",
  "/solutions",
  "/industries",
  "/pricing",
  "/demo",
  "/contact",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets and Next internals; everything else passes through
  // the auth check above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
