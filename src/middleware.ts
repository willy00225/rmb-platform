import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const limiter = rateLimit({ windowMs: 10_000, max: 15 });

export async function middleware(request: NextRequest) {
  // Rate limiting sur les API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ||
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
    return response;
  }

  // Blocage des utilisateurs suspendus (vérifié dans les API, pas ici pour les pages)
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};