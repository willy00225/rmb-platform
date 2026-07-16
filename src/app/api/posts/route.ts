import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSpam, containsBlockedContent, isToxic } from "@/lib/moderation";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const feed = url.searchParams.get("feed") || "recent"; // "recent" (défaut) ou "for_you"
  const limit = parseInt(url.searchParams.get("limit") || "30");

  // 1. Récupérer les amis acceptés (utilisé uniquement pour "for_you")
  let friendIds: string[] = [];
  if (feed === "for_you") {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: session.user.id },
          { addresseeId: session.user.id },
        ],
        status: "ACCEPTED",
      },
      select: { requesterId: true, addresseeId: true },
    });
    friendIds = friendships.map(f =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    );
  }

  // 2. Requête de base
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
        where: { parentId: null },
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
        select: { sharedBy: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200, // On prend un échantillon large pour scorer ensuite
  });

  // 3. Calcul du score de pertinence (uniquement pour "for_you")
  if (feed === "for_you") {
    const scoredPosts = posts.map(post => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.reduce(
        (acc, c) => acc + 1 + (c.replies?.length || 0),
        0
      );
      const ageInHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000);
      const isFriend = friendIds.includes(post.userId) ? 1.5 : 1;

      // Score : likes * 2 + commentaires * 3, divisé par l'âge, bonus ami
      const score = (likesCount * 2 + commentsCount * 3) / (ageInHours + 2) * isFriend;
      return { ...post, score };
    });

    // Trier par score décroissant et limiter
    scoredPosts.sort((a: any, b: any) => b.score - a.score);
    const topPosts = scoredPosts.slice(0, limit);

    const serialized = topPosts.map((post: any) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      sharesCount: post._count.sharedBy,
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

  // 4. Comportement par défaut (tri chronologique)
  const serialized = posts.slice(0, limit).map((post: any) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    sharesCount: post._count.sharedBy,
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

    // ✅ Récupérer les médias du post original pour les transmettre au partage
    const originalPost = await prisma.post.findUnique({
      where: { id: sharedPostId },
      select: { mediaUrl: true, mediaType: true },
    });

    const post = await prisma.post.create({
      data: {
        content: "",
        sharedPostId,
        userId: session.user.id,
        visible: true,
        mediaUrl: originalPost?.mediaUrl || null,   // ✅ média du post original
        mediaType: originalPost?.mediaType || null, // ✅ type du média
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