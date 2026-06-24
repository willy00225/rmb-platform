import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// Récupérer les spots (admin) – filtre optionnel ?type=spot pour n’avoir que les spots
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(req.url);
  const showOnlySpots = url.searchParams.get("type") === "spot";

  const spots = await prisma.event.findMany({
    where: showOnlySpots ? { spotActive: true } : {},
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

  const {
    title,
    description,
    location,
    startDate,
    endDate,
    imageUrl,
    mediaType,
    link,
    priority,
    active,
  } = await req.json();

  // Le titre est toujours requis, la description devient optionnelle
  if (!title) {
    return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
  }

  const spot = await prisma.event.create({
    data: {
      title,
      description: description || null,
      location: location || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      imageUrl: imageUrl || null,
      mediaType: mediaType || "image",
      link: link || null,
      priority: priority || 0,
      spotActive: active !== undefined ? active : true, // par défaut actif
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