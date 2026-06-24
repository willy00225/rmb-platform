import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Liste des champs autorisés à la modification
const ALLOWED_FIELDS = ["title", "description", "startDate", "endDate", "location"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de la session et du rôle admin
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Filtrer uniquement les champs autorisés
    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Vérifier que des champs autorisés sont présents
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data,
    });

    // Retourner uniquement les champs nécessaires
    return NextResponse.json({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
    });
  } catch (error: any) {
    console.error("Erreur lors de la modification de l'événement :", error);
    if (error.code === "P2025") {
      // Prisma : enregistrement non trouvé
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    // Vérifier que l'événement existe avant suppression
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Événement supprimé" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'événement :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}