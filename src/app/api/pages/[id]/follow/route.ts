import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: pageId } = await params;

  if (!isValidUUID(pageId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { suspended: true, creatorId: true, name: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }
  if (page.suspended) {
    return NextResponse.json({ error: "Cette page est suspendue" }, { status: 403 });
  }

  const recentFollows = await prisma.pageFollow.count({
    where: {
      userId: session.user.id,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recentFollows >= 10) {
    return NextResponse.json(
      { error: "Trop d'actions, veuillez ralentir." },
      { status: 429 }
    );
  }

  const existing = await prisma.pageFollow.findUnique({
    where: { userId_pageId: { userId: session.user.id, pageId } },
  });

  if (existing) {
    await prisma.pageFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ followed: false });
  } else {
    const totalFollows = await prisma.pageFollow.count({
      where: { userId: session.user.id },
    });
    if (totalFollows >= 500) {
      return NextResponse.json({ error: "Limite de 500 abonnements atteinte" }, { status: 403 });
    }

    await prisma.pageFollow.create({
      data: { userId: session.user.id, pageId },
    });

    if (page.creatorId !== session.user.id) {
      const follower = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true },
      });
      await notifyUser(
        page.creatorId,
        "page_followed",
        "Nouvel abonné à votre page 🎉",
        `${follower?.firstName || "Quelqu'un"} a commencé à suivre votre page "${page.name}".`
      );
    }

    return NextResponse.json({ followed: true });
  }
}