import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

const HOURS_PER_CREDIT = 24; // 1 crédit = 24 heures de boost

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

  const { id: postId } = await params;

  // Validation UUID
  if (!isValidUUID(postId)) {
    return NextResponse.json({ error: "Identifiant de post invalide" }, { status: 400 });
  }

  // 1. Récupérer le post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, isBoosted: true, createdAt: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // 2. Vérifier que le post n'est pas déjà boosté
  if (post.isBoosted) {
    return NextResponse.json(
      { error: "Ce post est déjà boosté." },
      { status: 400 }
    );
  }

  // 3. Ancienneté maximale du post (7 jours)
  const ageInDays =
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 3600 * 24);
  if (ageInDays > 7) {
    return NextResponse.json(
      { error: "Impossible de booster un post de plus de 7 jours." },
      { status: 400 }
    );
  }

  // 4. Récupérer l'utilisateur et ses crédits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { boosts: true, firstName: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // 5. Lire la durée demandée (en heures), avec validation
  let requestedHours = 24; // valeur par défaut
  try {
    const body = await req.json();
    if (body && typeof body.hours === "number") {
      requestedHours = Math.min(
        Math.max(1, Math.floor(body.hours)),
        72
      );
    }
  } catch {
    // garder 24h par défaut
  }

  // 6. Calculer le coût en crédits
  const creditsNeeded = Math.ceil(requestedHours / HOURS_PER_CREDIT);

  if (user.boosts < creditsNeeded) {
    return NextResponse.json(
      {
        error: `Crédits insuffisants. Vous avez ${user.boosts} crédit(s), il en faut ${creditsNeeded} pour ${requestedHours}h.`,
      },
      { status: 400 }
    );
  }

  // 7. Vérifier la limite de boosts simultanés (5 max)
  const activeBoosts = await prisma.post.count({
    where: {
      userId: session.user.id,
      isBoosted: true,
      boostedUntil: { gt: new Date() },
    },
  });
  if (activeBoosts >= 5) {
    return NextResponse.json(
      { error: "Vous avez déjà 5 posts boostés simultanément." },
      { status: 400 }
    );
  }

  // 8. Calculer la date de fin
  const boostedUntil = new Date();
  boostedUntil.setHours(boostedUntil.getHours() + requestedHours);

  // 9. Appliquer le boost et décrémenter les crédits (transaction)
  await prisma.$transaction([
    prisma.post.update({
      where: { id: postId },
      data: { isBoosted: true, boostedUntil },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { boosts: { decrement: creditsNeeded } },
    }),
  ]);

  // 10. Notifications aux amis (respectueuses des préférences)
  try {
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
    const friendIds = friendships.map((f) =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    );

    for (const friendId of friendIds) {
      await notifyUser(
        friendId,
        "post_boosted",
        "Publication boostée 🚀",
        `${user.firstName || "Quelqu'un"} a boosté une publication pour ${requestedHours}h.`
      );
    }
  } catch (err) {
    console.error("Erreur notification boost :", err);
  }

  return NextResponse.json({
    success: true,
    boostedUntil: boostedUntil.toISOString(),
    durationHours: requestedHours,
    creditsUsed: creditsNeeded,
    remainingCredits: user.boosts - creditsNeeded,
  });
}