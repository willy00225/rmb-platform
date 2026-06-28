import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const story = await prisma.story.findUnique({ where: { id } });

    if (!story) {
      return NextResponse.json({ error: "Story introuvable" }, { status: 404 });
    }

    // Seul le propriétaire peut supprimer
    if (story.userId !== session.user.id) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.story.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/stories/[id] :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}