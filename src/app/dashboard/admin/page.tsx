// src/app/dashboard/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Users,
  DollarSign,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Radio,
  AlertTriangle,
  CalendarDays,
  Megaphone,
} from "lucide-react";
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
    const found = donationsByMonthRaw.find((row: Record<string, unknown>) => row.month === month);
    return { month, total: found ? found.total : 0 };
  });

  const membersByMonth = months.map(month => {
    const found = membersByMonthRaw.find((row: Record<string, unknown>) => row.month === month);
    return { month, count: found ? found.count : 0 };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Administration
      </h1>

      {/* Statistiques - cartes avec fond adapté au dark mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400">
              Total membres
            </CardTitle>
            <Users size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text dark:text-white">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400">
              Total dons
            </CardTitle>
            <DollarSign size={20} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text dark:text-white">
              {totalDonationsAmount.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400">
              Dons en attente
            </CardTitle>
            <DollarSign size={20} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text dark:text-white">{pendingDonations}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400">
              KYC en attente
            </CardTitle>
            <ShieldCheck size={20} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text dark:text-white">{pendingKycCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400">
              Publications
            </CardTitle>
            <MessageCircle size={20} className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text dark:text-white">{totalPosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapides améliorés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            href: "/dashboard/admin/donations",
            icon: DollarSign,
            color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10",
            title: "Validation des dons",
            desc: `${pendingDonations} don(s) en attente de confirmation`,
          },
          {
            href: "/dashboard/admin/members",
            icon: Users,
            color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
            title: "Gestion des membres",
            desc: "Rôles, KYC, suspensions",
          },
          {
            href: "/dashboard/admin/spots",
            icon: Radio,
            color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
            title: "Spots & Annonces",
            desc: "Publier une annonce exceptionnelle",
          },
          {
            href: "/dashboard/admin/reports",
            icon: AlertTriangle,
            color: "text-red-500 bg-red-50 dark:bg-red-500/10",
            title: "Signalements",
            desc: `${pendingReports} signalement(s) en attente`,
          },
          {
            href: "/dashboard/admin/kyc",
            icon: ShieldCheck,
            color: "text-green-500 bg-green-50 dark:bg-green-500/10",
            title: "Vérification KYC",
            desc: `${pendingKycCount} document(s) à valider`,
          },
          {
            href: "/dashboard/admin/events",
            icon: CalendarDays,
            color: "text-teal-500 bg-teal-50 dark:bg-teal-500/10",
            title: "Événements",
            desc: "Créer et gérer les événements",
          },
          {
            href: "/dashboard/admin/radio",
            icon: Radio,
            color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
            title: "Radio",
            desc: "Gérer le direct et les podcasts",
          },
          {
            href: "/dashboard/admin/notify",
            icon: Megaphone,
            color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10",
            title: "Notifications push",
            desc: "Envoyer une campagne de notifications",
          },
          {
            href: "/dashboard/admin/audit",
            icon: TrendingUp,
            color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
            title: "Journal d'audit",
            desc: "Historique de toutes les actions",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 shadow-sm hover:shadow-md transition"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text dark:text-white">
                {item.title}
              </h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Graphiques */}
      <AdminCharts donationsByMonth={donationsByMonth} membersByMonth={membersByMonth} />
    </div>
  );
}