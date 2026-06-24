import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;

  // Vérifier que la story existe
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) {
    return NextResponse.json({ error: "Story introuvable" }, { status: 404 });
  }

  // Vérifier si l'utilisateur a déjà liké (table StoryLike à créer)
  // Pour simplifier, on va utiliser un modèle simple : on compte les likes.
  // On suppose qu'on a une table StoryLike avec userId + storyId.
  // Nous allons la créer.

  // Si vous n'avez pas encore la table, ajoutez-la dans schema.prisma :
  // model StoryLike {
  //   id        String   @id @default(uuid())
  //   storyId   String
  //   userId    String
  //   createdAt DateTime @default(now())
  //   story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  //   user      User     @relation(fields: [userId], references: [id])
  //   @@unique([storyId, userId])
  // }
  // puis npx prisma db push

  const existingLike = await (prisma as any).storyLike.findUnique({
    where: {
      storyId_userId: { storyId: id, userId: session.user.id },
    },
  });

  if (existingLike) {
    // Déjà liké → on supprime le like (unlike)
    await (prisma as any).storyLike.delete({
      where: { id: existingLike.id },
    });
    return NextResponse.json({ liked: false });
  } else {
    // Nouveau like
    await (prisma as any).storyLike.create({
      data: { storyId: id, userId: session.user.id },
    });
    return NextResponse.json({ liked: true });
  }
}