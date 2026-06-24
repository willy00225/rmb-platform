import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: eventId } = await params;

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour vous inscrire à un événement.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const existing = await prisma.participation.findFirst({
    where: { eventId, userId: session.user.id },
  });
  if (existing) return NextResponse.json({ error: "Déjà inscrit" }, { status: 400 });

  const participation = await prisma.participation.create({
    data: { eventId, userId: session.user.id },
  });

  await updateChallenges("registrations");
  await checkAndAwardBadges(session.user.id);
  await addXp(session.user.id, 15);

  return NextResponse.json(participation, { status: 201 });
}