import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount < 500) return NextResponse.json({ error: "Montant minimum 500 XOF" }, { status: 400 });

  const donation = await prisma.donation.create({
    data: {
      userId: session.user.id,
      amount,
      paymentId: `test_${Date.now()}`,
      receiptUrl: "",
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totalDonated: { increment: amount } },
  });

  await updateChallenges("donations");
  await checkAndAwardBadges(session.user.id);
  await addXp(session.user.id, 20);

  await sendPushNotification({
    headings: { fr: "Merci pour votre don ❤️" },
    contents: { fr: `Votre don de ${amount} XOF a bien été reçu.` },
    includeExternalUserIds: [session.user.id],
  });

  return NextResponse.json(donation, { status: 201 });
}