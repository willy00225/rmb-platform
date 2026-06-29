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

  const { id: postId } = await params;

  // Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour aimer une publication.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ liked: true });

  await prisma.postLike.create({
    data: { postId, userId: session.user.id },
  });

  // Notification à l'auteur du post (sauf si c'est lui-même)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, content: true },
  });
  if (post && post.userId !== session.user.id) {
    const liker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true },
    });
    await sendPushNotification({
      headings: { fr: "Nouveau J’aime 👍" },
      contents: { fr: `${liker?.firstName || "Quelqu’un"} a aimé votre publication.` },
      includeExternalUserIds: [post.userId],
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

  const { id: postId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json({ error: "Votre identité doit être vérifiée." }, { status: 403 });
  }

  await prisma.postLike.deleteMany({
    where: { postId, userId: session.user.id },
  });
  return NextResponse.json({ liked: false });
}