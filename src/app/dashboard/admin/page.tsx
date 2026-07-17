// src/app/dashboard/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
  BarChart3,
  Clock,
  FileText,
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

  // Accès rapides enrichis
  const quickActions = [
    {
      href: "/dashboard/admin/donations",
      icon: DollarSign,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      title: "Validation des dons",
      desc: `${pendingDonations} don(s) en attente`,
      badge: pendingDonations > 0 ? pendingDonations : null,
    },
    {
      href: "/dashboard/admin/members",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      title: "Gestion des membres",
      desc: "Rôles, KYC, suspensions",
      badge: totalMembers,
    },
    {
      href: "/dashboard/admin/kyc",
      icon: ShieldCheck,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-500/10",
      title: "Vérification KYC",
      desc: `${pendingKycCount} document(s) à valider`,
      badge: pendingKycCount > 0 ? pendingKycCount : null,
    },
    {
      href: "/dashboard/admin/reports",
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
      title: "Signalements",
      desc: `${pendingReports} signalement(s) en attente`,
      badge: pendingReports > 0 ? pendingReports : null,
    },
    {
      href: "/dashboard/admin/events",
      icon: CalendarDays,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-500/10",
      title: "Événements",
      desc: "Créer et gérer les événements",
      badge: totalEvents,
    },
    {
      href: "/dashboard/admin/spots",
      icon: Radio,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      title: "Spots & Annonces",
      desc: "Publier une annonce exceptionnelle",
    },
    {
      href: "/dashboard/admin/radio",
      icon: Radio,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      title: "Radio",
      desc: "Gérer le direct et les podcasts",
    },
    {
      href: "/dashboard/admin/notify",
      icon: Megaphone,
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-500/10",
      title: "Notifications push",
      desc: "Envoyer une campagne",
    },
    {
      href: "/dashboard/admin/audit",
      icon: FileText,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      title: "Journal d'audit",
      desc: "Historique des actions",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <BarChart3 size={28} className="text-primary" />
            Administration
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Bienvenue, {session.user.name || "Admin"}. Voici un aperçu de la plateforme.
          </p>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-premium p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Membres</p>
            <p className="text-xl font-bold text-text">{totalMembers}</p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
            <DollarSign size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total dons</p>
            <p className="text-xl font-bold text-text">{totalDonationsAmount.toLocaleString()} F</p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Dons en attente</p>
            <p className="text-xl font-bold text-text">{pendingDonations}</p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">KYC en attente</p>
            <p className="text-xl font-bold text-text">{pendingKycCount}</p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <MessageCircle size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Publications</p>
            <p className="text-xl font-bold text-text">{totalPosts}</p>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Accès rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="card-premium p-5 flex items-start gap-4 hover:shadow-md transition group"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={22} className={item.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Graphiques */}
      <AdminCharts donationsByMonth={donationsByMonth} membersByMonth={membersByMonth} />
    </div>
  );
}