import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: storyId } = await params;

    // Vérifier que la story existe
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      return NextResponse.json({ error: "Story introuvable" }, { status: 404 });
    }

    // Ne pas compter si c'est l'auteur lui-même
    if (story.userId === session.user.id) {
      return NextResponse.json({ viewed: false, reason: "Propriétaire" });
    }

    // Enregistrer la vue (ignore si déjà existant)
    await prisma.storyView.upsert({
      where: {
        storyId_userId: { storyId, userId: session.user.id },
      },
      create: { storyId, userId: session.user.id },
      update: {}, // ne rien faire si déjà présent
    });

    return NextResponse.json({ viewed: true });
  } catch (error) {
    console.error("Erreur POST /api/stories/[id]/view :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}