import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let query = searchParams.get("q") || "";

  // Nettoyage : trim et limiter à 100 caractères max
  query = query.trim().substring(0, 100);

  // Si la requête est vide ou trop courte, retourner un tableau vide
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  // Éviter les requêtes trop génériques ou abusives
  const blockedPatterns = ["*", "%", "_"];
  if (blockedPatterns.some((p) => query === p)) {
    return NextResponse.json([]);
  }

  const pages = await prisma.page.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      suspended: false,
    },
    include: {
      _count: {
        select: { followers: true, posts: true },
      },
    },
    orderBy: { followers: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json(pages);
}