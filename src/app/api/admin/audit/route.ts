import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;
  const actionFilter = url.searchParams.get("action") || ""; // ex: "USER_UPDATED"
  const search = url.searchParams.get("search") || ""; // recherche dans entityId ou admin name

  const where: Record<string, unknown> = {};
  if (actionFilter) where.action = actionFilter;
  if (search) {
    where.OR = [
      { entityId: { contains: search, mode: "insensitive" } },
      { admin: { firstName: { contains: search, mode: "insensitive" } } },
      { admin: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
