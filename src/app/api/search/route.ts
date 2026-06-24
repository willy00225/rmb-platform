import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ users: [], posts: [], groups: [], products: [] });

  const [users, posts, groups, products] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, avatar: true },
      take: 5,
    }),
    prisma.post.findMany({
      where: { content: { contains: q, mode: "insensitive" } },
      select: { id: true, content: true, createdAt: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.marketplaceProduct.findMany({
      where: { title: { contains: q, mode: "insensitive" }, status: "active" },
      select: { id: true, title: true, price: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ users, posts, groups, products });
}
