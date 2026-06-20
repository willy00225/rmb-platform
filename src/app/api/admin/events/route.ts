import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: {
      // Optionnel : exclure les spots (annonces) si vous voulez
      // spotActive: false,
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startDate: true,
      endDate: true,
    },
  });

  return NextResponse.json(events);
}