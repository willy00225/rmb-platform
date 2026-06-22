// src/app/dashboard/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, DollarSign, MessageCircle, CalendarDays, Radio, ScanLine, ShieldCheck, Settings } from "lucide-react";
import Link from "next/link";
import { AdminCharts } from "@/components/admin/AdminCharts";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return null;
  }

  const [
    totalMembers,
    totalDonations,
    pendingDonations,
    totalPosts,
    totalEvents,
    pendingReports,
    pendingKycCount,
    totalGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.manualDonation.count({ where: { status: "PENDING" } }),
    prisma.post.count(),
    prisma.event.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
    prisma.group.count(),
  ]);

  const totalDonationsAmount = totalDonations._sum.amount || 0;

  // --- Statistiques pour les graphiques (6 derniers mois) ---
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const donationsByMonthRaw = await prisma.$queryRaw<Array<{ month: string; total: number }>>`
    SELECT 
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      SUM(amount)::float as total
    FROM "Donation"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month
  `;

  const membersByMonthRaw = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
    SELECT 
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      COUNT(*)::int as count
    FROM "User"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month
  `;

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const donationsByMonth = months.map(month => {
    const found = donationsByMonthRaw.find((row: any) => row.month === month);
    return { month, total: found ? found.total : 0 };
  });

  const membersByMonth = months.map(month => {
    const found = membersByMonthRaw.find((row: any) => row.month === month);
    return { month, count: found ? found.count : 0 };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Administration</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total membres</CardTitle>
            <Users size={20} className="text-brand-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total dons</CardTitle>
            <DollarSign size={20} className="text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalDonationsAmount.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Dons en attente</CardTitle>
            <DollarSign size={20} className="text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingDonations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">KYC en attente</CardTitle>
            <ShieldCheck size={20} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingKycCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Publications</CardTitle>
            <MessageCircle size={20} className="text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalPosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link href="/dashboard/admin/donations" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Validation des dons</h2>
          <p className="text-sm text-gray-400 mt-2">{pendingDonations} don(s) en attente</p>
        </Link>
        <Link href="/dashboard/admin/members" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Gestion des membres</h2>
          <p className="text-sm text-gray-400 mt-2">Rôles, KYC, suspensions</p>
        </Link>
        <Link href="/dashboard/admin/kyc" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-white">KYC</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">{pendingKycCount} document(s) en attente</p>
        </Link>
        <Link href="/dashboard/admin/spots" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Spots & Annonces</h2>
          <p className="text-sm text-gray-400 mt-2">Publier une annonce exceptionnelle</p>
        </Link>
        <Link href="/dashboard/admin/reports" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Signalements</h2>
          <p className="text-sm text-gray-400 mt-2">{pendingReports} signalement(s) en attente</p>
        </Link>
        <Link href="/dashboard/admin/premium" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Gestion Premium</h2>
          <p className="text-sm text-gray-400 mt-2">Abonnements, boosts, fonctionnalités</p>
        </Link>
        <Link href="/dashboard/admin/notify" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Campagnes</h2>
          <p className="text-sm text-gray-400 mt-2">Envoyer une notification</p>
        </Link>
        <Link href="/dashboard/admin/audit" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <h2 className="text-lg font-semibold text-white">Journal d'audit</h2>
          <p className="text-sm text-gray-400 mt-2">Historique de toutes les actions</p>
        </Link>
        <Link href="/dashboard/admin/radio" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <div className="flex items-center gap-2">
            <Radio size={20} className="text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Radio</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">Gérer le direct et les podcasts</p>
        </Link>
        <Link href="/dashboard/admin/events" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Événements</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">Lister les événements et accéder au check-in</p>
        </Link>
        <Link href="/dashboard/admin/site-settings" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Paramètres du site</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">Logo, contacts</p>
        </Link>
      </div>

      {/* Graphiques */}
      <AdminCharts donationsByMonth={donationsByMonth} membersByMonth={membersByMonth} />
    </div>
  );
}