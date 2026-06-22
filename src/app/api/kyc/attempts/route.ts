import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 3;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Début de la journée (minuit)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nombre de documents soumis aujourd'hui
  const count = await prisma.kycDocument.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: today },
    },
  });

  const remaining = Math.max(0, MAX_ATTEMPTS - count);

  return NextResponse.json({ remaining });
}