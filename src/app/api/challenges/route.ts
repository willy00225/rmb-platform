import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET : lister les défis actifs (pour les membres)
export async function GET() {
  const challenges = await prisma.challenge.findMany({
    where: { active: true },
    orderBy: { endDate: "asc" },
  });
  return NextResponse.json(challenges);
}

// POST : créer un défi (admin)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, description, goalType, goalValue, startDate, endDate } = await req.json();

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      goalType,
      goalValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}
