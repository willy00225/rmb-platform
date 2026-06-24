import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const topMembers = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      level: true,
      xp: true,
      avatar: true,
    },
    orderBy: { xp: "desc" },
    take: 20,
  });
  return NextResponse.json(topMembers);
}
