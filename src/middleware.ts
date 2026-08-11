import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/login" : "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token.role !== "admin" && token.role !== "superadmin") {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/account/:path*"],
};
