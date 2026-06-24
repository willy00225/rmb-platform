import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const likes = await (prisma as any).storyLike.findMany({
    where: { storyId: id },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ likes, count: likes.length });
}