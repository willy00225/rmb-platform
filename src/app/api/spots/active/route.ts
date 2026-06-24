import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const spots = await prisma.event.findMany({
    where: {
      spotActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: "desc" },   // ← priorité
    select: {
      id: true,
      title: true,
      imageUrl: true,
      mediaType: true,
      link: true,
      priority: true,
      startDate: true,
      endDate: true,
    },
  });
  return NextResponse.json(spots);
}