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
  const { content } = await req.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  // Créez le modèle StoryComment dans schema.prisma :
  // model StoryComment {
  //   id        String   @id @default(uuid())
  //   storyId   String
  //   userId    String
  //   content   String
  //   createdAt DateTime @default(now())
  //   story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  //   user      User     @relation(fields: [userId], references: [id])
  // }
  const comment = await (prisma as any).storyComment.create({
    data: {
      storyId: id,
      userId: session.user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  return NextResponse.json(comment, { status: 201 });
}