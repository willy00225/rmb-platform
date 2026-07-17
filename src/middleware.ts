import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 10_000, max: 60 });

const publicApiPaths = [
  "/api/site-config",
  "/api/auth",
  "/api/avatar",
  "/api/cover",
  "/api/uploads",
];

// En-têtes de sécurité communs
function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // HSTS uniquement en production sur HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return response;
}

// Vérification CSRF basique pour les requêtes mutantes sur les API
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // pas d'origin → requête same-origin ou outil dev
  const allowedOrigins = [
    request.nextUrl.origin,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];
  return allowedOrigins.some((allowed) => origin === allowed);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Protection CSRF sur les API mutantes
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !isSameOrigin(request)
  ) {
    return new NextResponse("Requête interdite", { status: 403 });
  }

  // Rate limiting
  if (
    pathname.startsWith("/api/") &&
    !publicApiPaths.some((p) => pathname.startsWith(p))
  ) {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success, remaining } = limiter(ip);
    if (!success) {
      const res = new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Veuillez ralentir." }),
        { status: 429, headers: { "Retry-After": "10" } }
      );
      return applySecurityHeaders(res);
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return applySecurityHeaders(response);
  }

  // Authentification pour /dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};