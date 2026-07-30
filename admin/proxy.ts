import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // cv_admin_session is a JS-set cookie on this domain, set after successful backend login.
  // cv_admin_at is httpOnly on the backend domain and NOT accessible here (cross-domain).
  const sessionCookie = req.cookies.get("cv_admin_session");
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|[^?]*\\.(?:ico|png|jpg|css|js)).*)"],
};
