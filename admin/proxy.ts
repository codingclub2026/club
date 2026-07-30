import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Client-side adminApi & localStorage Bearer tokens handle authentication on mobile/desktop.
  // We do not hard-redirect server-side here to prevent mobile Safari/Chrome ITP from dropping
  // top-level navigations before client Bearer tokens can be attached.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|[^?]*\\.(?:ico|png|jpg|css|js)).*)"],
};
