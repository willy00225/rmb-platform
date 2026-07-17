import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pageId } = await params;

  // Validation UUID
  if (!isValidUUID(pageId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, name: true, suspended: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  // Ne pas exposer les stats d'une page suspendue
  if (page.suspended) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  const [totalPosts, totalLikes, totalComments, totalFollowers] = await Promise.all([
    prisma.post.count({ where: { pageId } }),
    prisma.postLike.count({ where: { post: { pageId } } }),
    prisma.comment.count({ where: { post: { pageId } } }),
    prisma.pageFollow.count({ where: { pageId } }),
  ]);

  return NextResponse.json({
    pageId: page.id,
    pageName: page.name,
    totalPosts,
    totalLikes,
    totalComments,
    totalFollowers,
  });
}