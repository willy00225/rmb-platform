import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 10_000, max: 15 });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Rate limiting sur toutes les API
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success, remaining } = limiter(ip);
    if (!success) {
      return new NextResponse("Trop de requêtes. Veuillez ralentir.", {
        status: 429,
        headers: { "Retry-After": "10" },
      });
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());

    // 2) Protection KYC sur les API (sauf exceptions)
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const baseUrl = request.nextUrl.origin;
    const userRes = await fetch(`${baseUrl}/api/user/me`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const user = userRes.ok ? await userRes.json() : null;

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    const isVerified =
      user?.kycLevel === "ID_VERIFIED" || user?.kycLevel === "AMBASSADOR";

    const allowedApiPaths = [
      "/api/profile",
      "/api/kyc",
      "/api/subscribe/status",
      "/api/auth",
      "/api/upload",
      "/api/user/me",
      "/api/admin/site-config",   // <-- autorisé sans KYC complet
    ];

    const isAllowed = allowedApiPaths.some(p => pathname.startsWith(p));

    if (!isAdmin && !isVerified && !isAllowed) {
      return new NextResponse("KYC requis pour cette fonctionnalité", {
        status: 403,
      });
    }

    if (pathname.startsWith("/api/admin") && !isAdmin) {
      return new NextResponse("Accès interdit", { status: 403 });
    }

    return response;
  }

  // 3) Protection KYC sur les pages dashboard (hors API)
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.id) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const baseUrl = request.nextUrl.origin;
    const userRes = await fetch(`${baseUrl}/api/user/me`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const user = userRes.ok ? await userRes.json() : null;

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    const isVerified =
      user?.kycLevel === "ID_VERIFIED" || user?.kycLevel === "AMBASSADOR";

    const allowedPaths = [
      "/dashboard/kyc",
      "/dashboard/profile",
      "/dashboard/settings",
      "/dashboard/premium",
    ];

    const isAllowed = allowedPaths.some(p => pathname.startsWith(p));

    if (!isAdmin && !isVerified && !isAllowed) {
      return NextResponse.redirect(new URL("/dashboard/kyc", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};