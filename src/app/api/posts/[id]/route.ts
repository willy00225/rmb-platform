import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Modifier un post (contenu uniquement)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
    }

    // Vérifier que le post appartient bien à l'utilisateur
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        comments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
        likes: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erreur PATCH /api/posts/[id] :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprimer un post
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

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE /api/posts/[id] :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}