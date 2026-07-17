import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSpam, containsBlockedContent, isToxic } from "@/lib/moderation";
import { notifyUser } from "@/lib/notify";
import { PostVisibility, FriendshipStatus, PageRole } from "@prisma/client";

// Validation d'URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Validation d'UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const feed = url.searchParams.get("feed") || "recent";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 50);

  let friendIds: string[] = [];
  if (feed === "for_you") {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: session.user.id },
          { addresseeId: session.user.id },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
      select: { requesterId: true, addresseeId: true },
    });
    friendIds = friendships.map(f =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    );
  }

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visible: true, visibility: PostVisibility.PUBLIC },
        { userId: session.user.id },
        {
          visibility: PostVisibility.FRIENDS,
          user: {
            OR: [
              { friendshipsRequested: { some: { addresseeId: session.user.id, status: FriendshipStatus.ACCEPTED } } },
              { friendshipsReceived: { some: { requesterId: session.user.id, status: FriendshipStatus.ACCEPTED } } },
            ],
          },
        },
      ],
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      page: {
        select: { id: true, name: true, imageUrl: true },
      },
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
          page: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
      _count: {
        select: { sharedBy: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (feed === "for_you") {
    const scoredPosts = posts.map(post => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.reduce(
        (acc, c) => acc + 1 + (c.replies?.length || 0),
        0
      );
      const ageInHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000);
      const isFriend = friendIds.includes(post.userId) ? 1.5 : 1;
      const score = (likesCount * 2 + commentsCount * 3) / (ageInHours + 2) * isFriend;
      return { ...post, score };
    });

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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { content, mediaUrl, mediaType, sharedPostId, visibility, pageId } = body;
  if (!content && !mediaUrl && !sharedPostId) {
    return NextResponse.json({ error: "Contenu, média ou partage requis" }, { status: 400 });
  }

  // Validation du contenu
  if (content && (typeof content !== "string" || content.length > 5000)) {
    return NextResponse.json({ error: "Contenu trop long (max 5000 caractères)." }, { status: 400 });
  }

  // Validation des URLs
  if (mediaUrl && !isValidUrl(mediaUrl)) {
    return NextResponse.json({ error: "URL du média invalide." }, { status: 400 });
  }

  // Validation de la visibilité
  const validVisibilities = Object.values(PostVisibility);
  if (visibility && !validVisibilities.includes(visibility)) {
    return NextResponse.json({ error: "Visibilité invalide." }, { status: 400 });
  }

  // Si pageId est fourni, vérifier l'existence, la non-suspension, et les droits
  if (pageId) {
    if (!isValidUUID(pageId)) {
      return NextResponse.json({ error: "Identifiant de page invalide." }, { status: 400 });
    }
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { suspended: true },
    });
    if (!page) {
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    }
    if (page.suspended) {
      return NextResponse.json({ error: "Cette page est suspendue, publication impossible." }, { status: 403 });
    }

    const membership = await prisma.pageMember.findUnique({
      where: { userId_pageId: { userId: session.user.id, pageId } },
    });
    if (!membership || (membership.role !== PageRole.ADMIN && membership.role !== PageRole.EDITOR)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à publier au nom de cette page." },
        { status: 403 }
      );
    }
  }

  // Anti-spam : max 10 posts par minute
  const recentPosts = await prisma.post.count({
    where: {
      userId: session.user.id,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recentPosts >= 10) {
    return NextResponse.json({ error: "Trop de publications, veuillez ralentir." }, { status: 429 });
  }

  // Récupérer le nom de l'utilisateur pour les notifications
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true },
  });
  const userName = currentUser?.firstName || "Quelqu’un";

  // Partage seul
  if (sharedPostId && !content && !mediaUrl) {
    if (!isValidUUID(sharedPostId)) {
      return NextResponse.json({ error: "Identifiant de post invalide." }, { status: 400 });
    }

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

    const originalPost = await prisma.post.findUnique({
      where: { id: sharedPostId },
      select: { mediaUrl: true, mediaType: true, visible: true, userId: true },
    });
    if (!originalPost || !originalPost.visible) {
      return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
    }

    const post = await prisma.post.create({
      data: {
        content: "",
        sharedPostId,
        userId: session.user.id,
        visible: true,
        visibility: (visibility as PostVisibility) || PostVisibility.PUBLIC,
        mediaUrl: originalPost.mediaUrl || null,
        mediaType: originalPost.mediaType || null,
        pageId: pageId || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        page: { select: { id: true, name: true, imageUrl: true } },
        sharedPost: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            page: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    // Notification à l'auteur du post original (sauf si c'est lui-même)
    if (originalPost.userId !== session.user.id) {
      await notifyUser(
        originalPost.userId,
        "new_share",
        "Votre publication a été partagée 🔄",
        `${userName} a partagé votre publication.`
      );
    }

    return NextResponse.json(post, { status: 201 });
  }

  // Publication classique
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
    return NextResponse.json({ error: "Vous êtes temporairement restreint." }, { status: 403 });
  }
  if (user.role === "SUSPENDED") {
    return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
  }

  if (content) {
    const blocked = containsBlockedContent(content);
    if (blocked) {
      return NextResponse.json(
        { error: `Contenu non autorisé (mot interdit : "${blocked}"). Veuillez reformuler.` },
        { status: 403 }
      );
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
          visibility: (visibility as PostVisibility) || PostVisibility.PUBLIC,
          userId: session.user.id,
          visible: false,
          pageId: pageId || null,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          page: { select: { id: true, name: true, imageUrl: true } },
        },
      });
      return NextResponse.json(
        { error: "Votre message a été placé en attente de modération.", post },
        { status: 202 }
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      content,
      mediaUrl,
      mediaType,
      sharedPostId,
      visibility: (visibility as PostVisibility) || PostVisibility.PUBLIC,
      userId: session.user.id,
      visible: true,
      pageId: pageId || null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      page: { select: { id: true, name: true, imageUrl: true } },
      comments: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      likes: { select: { userId: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}