/**
 * Next.js Proxy (Middleware) — CodeVed Frontend
 *
 * Auth strategy:
 * - Student routes (/dashboard, /tickets, /profile): require Clerk session
 * - Admin routes (/admin/*): require cv_admin_at HttpOnly cookie (set by backend).
 */

import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // ── Admin routes: cookie-only gate — NO Clerk involved ────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminCookie = req.cookies.get("cv_admin_at");
    if (!adminCookie) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ── Student protected routes: require Clerk session ───────────────────────
  const isProtectedStudent =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tickets") ||
    pathname.startsWith("/profile");

  if (isProtectedStudent) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
