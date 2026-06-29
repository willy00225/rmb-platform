import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSpam, containsBlockedContent, isToxic } from "@/lib/moderation";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visible: true },
        { userId: session.user.id },
      ],
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      comments: {
        where: { parentId: null },   // uniquement les commentaires principaux
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true } },
          replies: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              likes: { select: { userId: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      likes: { select: { userId: true } },
      sharedPost: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      },
      _count: {
        select: { sharedBy: true },   // ✅ nombre de partages
      },
    },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
  });

  const serialized = posts.map((post: any) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    sharesCount: post._count.sharedBy,   // ✅ intégré dans la réponse
    comments: post.comments.map((c: any) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      replies: c.replies.map((r: any) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    })),
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content, mediaUrl, mediaType, sharedPostId } = await req.json();
  if (!content && !mediaUrl && !sharedPostId) return NextResponse.json({ error: "Contenu, média ou partage requis" }, { status: 400 });

  // ✅ Si c'est un partage seul, on autorise sans contenu
  if (sharedPostId && !content && !mediaUrl) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycLevel: true, restrictedUntil: true, role: true },
    });
    if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
      return NextResponse.json(
        { error: "Votre identité doit être vérifiée pour partager.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }
    if (user.restrictedUntil && new Date() < user.restrictedUntil) {
      return NextResponse.json({ error: "Vous êtes temporairement restreint." }, { status: 403 });
    }
    if (user.role === "SUSPENDED") {
      return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        content: "",
        sharedPostId,
        userId: session.user.id,
        visible: true,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        sharedPost: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  }

  // Vérification classique pour publication avec contenu ou média
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true, restrictedUntil: true, role: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour publier.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  if (user.restrictedUntil && new Date() < user.restrictedUntil) {
    return NextResponse.json({ error: "Vous êtes temporairement restreint de publication." }, { status: 403 });
  }
  if (user.role === "SUSPENDED") {
    return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
  }

  if (content) {
    const blocked = containsBlockedContent(content);
    if (blocked) {
      return NextResponse.json({ error: `Contenu non autorisé (mot interdit : "${blocked}"). Veuillez reformuler.` }, { status: 403 });
    }
    if (isSpam(content)) {
      return NextResponse.json({ error: "Contenu détecté comme spam. Veuillez réduire la répétition." }, { status: 403 });
    }
    if (isToxic(content)) {
      const post = await prisma.post.create({
        data: {
          content,
          mediaUrl,
          mediaType,
          sharedPostId,
          userId: session.user.id,
          visible: false,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      });
      return NextResponse.json({ error: "Votre message a été placé en attente de modération.", post }, { status: 202 });
    }
  }

  const post = await prisma.post.create({
    data: {
      content,
      mediaUrl,
      mediaType,
      sharedPostId,
      userId: session.user.id,
      visible: true,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      comments: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      likes: { select: { userId: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}