import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const posts = await prisma.post.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
      comments: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      likes: {
        select: { userId: true },
      },
      sharedPost: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true } },
          comments: {
            include: {
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      sharedBy: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content, mediaUrl, mediaType, sharedPostId } = await req.json();
  if (!content && !mediaUrl) return NextResponse.json({ error: "Contenu ou média requis" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      content,
      mediaUrl,
      mediaType,
      sharedPostId: sharedPostId || null,
      userId: session.user.id,
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
      comments: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      likes: { select: { userId: true } },
      sharedPost: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true } },
          comments: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
        },
      },
    },
  });

  // Progression, badges et XP
  await updateChallenges("posts");
  await checkAndAwardBadges(session.user.id);
  await addXp(session.user.id, 10);

  await sendPushNotification({
    headings: { fr: "Nouveau post" },
    contents: { fr: content || "Nouvelle publication" },
  });

  if (sharedPostId) {
    const originalPost = await prisma.post.findUnique({
      where: { id: sharedPostId },
      select: { userId: true },
    });
    if (originalPost && originalPost.userId !== session.user.id) {
      const sharer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true },
      });
      await sendPushNotification({
        headings: { fr: "Votre publication a été partagée 🔁" },
        contents: { fr: `${sharer?.firstName || "Quelqu’un"} a partagé votre publication.` },
        includeExternalUserIds: [originalPost.userId],
      });
    }
  }

  return NextResponse.json(post, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { postId, action } = await req.json();
  if (!postId || !action || !["like", "unlike"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const userId = session.user.id;

  if (action === "like") {
    await prisma.postLike.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      update: {},
      create: {
        postId,
        userId,
      },
    });
  } else {
    await prisma.postLike.deleteMany({
      where: {
        postId,
        userId,
      },
    });
  }

  const likeCount = await prisma.postLike.count({
    where: { postId },
  });

  return NextResponse.json({ postId, likeCount, likedByUser: action === "like" });
}