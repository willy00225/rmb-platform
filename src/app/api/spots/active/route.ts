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
    orderBy: { createdAt: "desc" },
  });
  // Tous les champs scalaires du modèle Event, y compris mediaType, sont automatiquement retournés
  return NextResponse.json(spots);
}