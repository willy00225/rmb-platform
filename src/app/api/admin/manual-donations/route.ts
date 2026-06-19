import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { createAuditLog } from "@/lib/audit";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const donations = await prisma.manualDonation.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(donations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { donationId, action, adminNote } = await req.json();

  const donation = await prisma.manualDonation.findUnique({ where: { id: donationId } });
  if (!donation || donation.status !== "PENDING")
    return NextResponse.json({ error: "Don introuvable ou déjà traité" }, { status: 404 });

  if (action === "confirm") {
    await prisma.manualDonation.update({
      where: { id: donationId },
      data: { status: "CONFIRMED", adminNote, validatedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: donation.userId },
      data: { totalDonated: { increment: donation.amount } },
    });

    await sendPushNotification({
      headings: { fr: "Don confirmé ✅" },
      contents: { fr: `Votre don de ${donation.amount} XOF a été validé. Merci !` },
      includeExternalUserIds: [donation.userId],
    });

    await createAuditLog({
      action: "DONATION_CONFIRMED",
      entityType: "ManualDonation",
      entityId: donationId,
      adminId: session.user.id,
      details: JSON.stringify({ amount: donation.amount, userId: donation.userId }),
    });

    await updateChallenges("donations");
    await checkAndAwardBadges(donation.userId);
    await addXp(donation.userId, 20);
  } else if (action === "reject") {
    await prisma.manualDonation.update({
      where: { id: donationId },
      data: { status: "REJECTED", adminNote },
    });

    await createAuditLog({
      action: "DONATION_REJECTED",
      entityType: "ManualDonation",
      entityId: donationId,
      adminId: session.user.id,
      details: JSON.stringify({ amount: donation.amount, userId: donation.userId, note: adminNote }),
    });
  } else {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}