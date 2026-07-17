import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: postId } = await params;

  // Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true, restrictedUntil: true, role: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour commenter.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }
  if (user.restrictedUntil && new Date() < user.restrictedUntil) {
    return NextResponse.json({ error: "Vous êtes temporairement restreint." }, { status: 403 });
  }
  if (user.role === "SUSPENDED") {
    return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
  }

  const { content, parentId, mediaUrl, mediaType } = await req.json();
  if (!content) return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId: session.user.id,
      parentId: parentId || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
    },
  });

  await updateChallenges("messages");
  await checkAndAwardBadges(session.user.id);
  await addXp(session.user.id, 5);

  const commenter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true },
  });
  const commenterName = commenter?.firstName || "Quelqu’un";

  // Notification à l'auteur du post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (post && post.userId !== session.user.id) {
    await notifyUser(
      post.userId,
      "new_comment",
      "Nouveau commentaire 💬",
      `${commenterName} a commenté votre publication.`
    );
  }

  // Notification au propriétaire du commentaire parent
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });
    if (parentComment && parentComment.userId !== session.user.id) {
      await notifyUser(
        parentComment.userId,
        "new_comment",
        "Nouvelle réponse 💬",
        `${commenterName} a répondu à votre commentaire.`
      );
    }
  }

  return NextResponse.json(comment, { status: 201 });
}