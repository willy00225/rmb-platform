import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 10_000, max: 60 }); // ← seuil relevé à 60 requêtes / 10 secondes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Rate limiting sur les API, sauf celles d'authentification
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success, remaining } = limiter(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez ralentir." },
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
  }

  // 2) Pour les pages dashboard, juste vérifier l'authentification
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.id) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    // La vérification KYC est déléguée au layout dashboard
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};