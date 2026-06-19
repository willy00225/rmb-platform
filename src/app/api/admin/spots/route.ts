import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// Récupérer tous les spots/événements (admin)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const spots = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organizer: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(spots);
}

// Créer un nouveau spot/événement (admin)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, description, location, startDate, endDate, imageUrl, mediaType } = await req.json();

  if (!title || !description) {
    return NextResponse.json({ error: "Titre et description requis" }, { status: 400 });
  }

  const spot = await prisma.event.create({
    data: {
      title,
      description,
      location: location || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      imageUrl: imageUrl || null,
      mediaType: mediaType || "image", // Ajout du mediaType
      organizerId: session.user.id,
    },
  });

  // Journal d'audit
  await createAuditLog({
    action: "SPOT_CREATED",
    entityType: "Event",
    entityId: spot.id,
    adminId: session.user.id,
    details: JSON.stringify({ title }),
  });

  return NextResponse.json(spot, { status: 201 });
}