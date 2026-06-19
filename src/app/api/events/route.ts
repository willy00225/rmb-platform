import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const events = await prisma.event.findMany({
    include: {
      organizer: { select: { firstName: true, lastName: true } },
      participations: { select: { userId: true, status: true } },
      _count: { select: { participations: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, description, startDate, endDate, location, imageUrl } = await req.json();
  if (!title || !startDate) return NextResponse.json({ error: "Champs requis" }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      location,
      imageUrl,
      organizerId: session.user.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}