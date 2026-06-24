import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let cachedConfig: Record<string, string> | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();
  if (!cachedConfig || now - lastFetch > CACHE_TTL) {
    const configs = await prisma.siteConfig.findMany();
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;
    cachedConfig = map;
    lastFetch = now;
  }
  return NextResponse.json(cachedConfig);
}
