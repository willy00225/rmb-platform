import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Dons automatiques (Stripe, test)
  const autoDonations = await prisma.donation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Dons manuels confirmés
  const manualDonations = await prisma.manualDonation.findMany({
    where: { userId: session.user.id, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
  });

  // Fusion et tri par date
  const allDonations = [
    ...autoDonations.map(d => ({ ...d, type: "card" })),
    ...manualDonations.map(d => ({ ...d, type: "mobile" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totalDonated: true },
  });

  return NextResponse.json({ donations: allDonations, total: user?.totalDonated || 0 });
}