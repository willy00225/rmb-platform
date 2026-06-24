import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        organizerId: true,
        _count: {
          select: { participations: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // ✅ Correction : paramètre typé any pour éviter l'erreur TypeScript
    const result = events.map(({ _count, ...event }: any) => ({
      ...event,
      participations: _count.participations,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur GET /api/admin/events :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { title, description, startDate, endDate, location } = await req.json();

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Titre requis et doit être une chaîne non vide" },
        { status: 400 }
      );
    }

    if (!startDate || isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { error: "Date de début invalide" },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : parsedStartDate;

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { error: "Date de fin invalide" },
        { status: 400 }
      );
    }

    if (endDate && parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        { error: "La date de fin ne peut pas être antérieure à la date de début" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        location: location?.trim() || null,
        organizerId: session.user.id,
      },
    });

    // Réponse structurée
    return NextResponse.json(
      {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        organizerId: event.organizerId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur POST /api/admin/events :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}