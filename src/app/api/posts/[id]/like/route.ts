import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: commentId } = await params;

  // Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ liked: true });

  await prisma.commentLike.create({
    data: { commentId, userId: session.user.id },
  });

  // Notification au propriétaire du commentaire
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, content: true },
  });
  if (comment && comment.userId !== session.user.id) {
    const liker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true },
    });
    await sendPushNotification({
      headings: { fr: "J’aime sur un commentaire ❤️" },
      contents: { fr: `${liker?.firstName || "Quelqu’un"} a aimé votre commentaire.` },
      includeExternalUserIds: [comment.userId],
    });
  }

  return NextResponse.json({ liked: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: commentId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json({ error: "Votre identité doit être vérifiée." }, { status: 403 });
  }

  await prisma.commentLike.deleteMany({
    where: { commentId, userId: session.user.id },
  });
  return NextResponse.json({ liked: false });
}