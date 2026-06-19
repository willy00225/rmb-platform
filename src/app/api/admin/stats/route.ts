import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Total membres
  const totalMembers = await prisma.user.count();

  // Dons totaux (Stripe + tests)
  const donationsAgg = await prisma.donation.aggregate({ _sum: { amount: true } });
  const totalDonations = donationsAgg._sum.amount || 0;

  // Dons manuels en attente
  const pendingManualDonations = await prisma.manualDonation.count({ where: { status: "PENDING" } });

  // Événements à venir
  const upcomingEvents = await prisma.event.count({
    where: { startDate: { gte: new Date() } },
  });

  // Posts récents
  const recentPosts = await prisma.post.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  // Données pour graphiques (6 derniers mois)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const donationsByMonth = await prisma.$queryRaw<{ month: string; total: number }[]>`
    SELECT to_char("createdAt", 'YYYY-MM') as month, SUM(amount)::float as total
    FROM "Donation"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month
  `;

  const membersByMonth = await prisma.$queryRaw<{ month: string; count: number }[]>`
    SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
    FROM "User"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month
  `;

  return NextResponse.json({
    totalMembers,
    totalDonations,
    pendingManualDonations,
    upcomingEvents,
    recentPosts,
    donationsByMonth,
    membersByMonth,
  });
}