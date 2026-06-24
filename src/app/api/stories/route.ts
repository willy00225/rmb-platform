import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

// GET : stories actives des amis + les siennes
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();

  // Récupérer les amis acceptés
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      status: "ACCEPTED",
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = friendships.map(f =>
    f.requesterId === session.user.id ? f.addresseeId : f.requesterId
  );

  const userIds = [session.user.id, ...friendIds];

  const stories = await prisma.story.findMany({
    where: {
      userId: { in: userIds },
      expiresAt: { gte: now },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(stories);
}

// POST : créer une story
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour publier une story.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { mediaUrl, mediaType } = await req.json();
  if (!mediaUrl) return NextResponse.json({ error: "Média requis" }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // expire dans 24h

  const story = await prisma.story.create({
    data: {
      userId: session.user.id,
      mediaUrl,
      mediaType: mediaType || "image",
      expiresAt,
    },
  });

  // --- Notification aux amis ---
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      status: "ACCEPTED",
    },
    select: { requesterId: true, addresseeId: true },
  });
  const friendIds = friendships.map(f =>
    f.requesterId === session.user.id ? f.addresseeId : f.requesterId
  );

  const userName = session.user.name || "Quelqu'un";
  for (const friendId of friendIds) {
    await sendPushNotification({
      headings: { fr: "Nouvelle story 📸" },
      contents: { fr: `${userName} a publié une story.` },
      includeExternalUserIds: [friendId],
    });
  }
  // ---------------------------------

  return NextResponse.json(story, { status: 201 });
}
