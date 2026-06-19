import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: params.id,
      userId: session.user.id,
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
    },
  });

  await updateChallenges("messages");
  await checkAndAwardBadges(session.user.id);
  await addXp(session.user.id, 5);

  // Notification à l'auteur du post (sauf si c'est lui-même)
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (post && post.userId !== session.user.id) {
    const commenter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true },
    });
    await sendPushNotification({
      headings: { fr: "Nouveau commentaire 💬" },
      contents: { fr: `${commenter?.firstName || "Quelqu’un"} a commenté votre publication.` },
      includeExternalUserIds: [post.userId],
    });
  }

  return NextResponse.json(comment, { status: 201 });
}