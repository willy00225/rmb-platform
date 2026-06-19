import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/dashboard/MemberCard";
import { ChallengeWidget } from "@/components/challenges/ChallengeWidget";
import { LiveWidget } from "@/components/live/LiveWidget";
import { redirect } from "next/navigation";
import { CalendarDays, Heart, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) redirect("/auth/login");

  // Récupération directe des relations familiales
  const relations = await prisma.familyRelation.findMany({
    where: {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
    },
    include: {
      fromUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      toUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  const parents: { id: string; firstName: string; lastName: string; avatar?: string | null }[] = [];
  const children: { id: string; firstName: string; lastName: string; avatar?: string | null }[] = [];
  const spouses: { id: string; firstName: string; lastName: string; avatar?: string | null }[] = [];
  const siblings: { id: string; firstName: string; lastName: string; avatar?: string | null }[] = [];

  for (const rel of relations) {
    if (rel.relation === "parent") {
      parents.push(rel.fromUserId === user.id ? rel.toUser : rel.fromUser);
    } else if (rel.relation === "child") {
      children.push(rel.fromUserId === user.id ? rel.toUser : rel.fromUser);
    } else if (rel.relation === "spouse") {
      spouses.push(rel.fromUserId === user.id ? rel.toUser : rel.fromUser);
    } else if (rel.relation === "sibling") {
      siblings.push(rel.fromUserId === user.id ? rel.toUser : rel.fromUser);
    }
  }

  const familyData = { parents, children, spouses, siblings };

  const memberCardUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? "",
    avatar: user.avatar,
    level: user.level,
    xp: user.xp,
    createdAt: user.createdAt.toISOString(),
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    city: user.city,
    village: user.village,
    canton: user.canton,
    currentCity: user.currentCity,
    currentVillage: user.currentVillage,
    currentCountry: user.currentCountry,
    phone: user.phone,
    fonction: user.fonction,
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">
          Bienvenue, {user.firstName}
        </h1>
        <p className="text-text-secondary text-sm">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          <span className="mx-2 text-secondary">•</span>
          Membre depuis {user.createdAt.getFullYear()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <MemberCard
            user={memberCardUser}
            parents={familyData.parents || []}
            siblings={familyData.siblings || []}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Widget Événements */}
          <div className="relative p-6 rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
            <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors">
              <CalendarDays size={32} />
            </div>
            <p className="text-sm text-text-secondary font-medium">Prochain événement</p>
            <p className="text-2xl font-bold text-text mt-3">Aucun</p>
            <p className="text-xs text-text-secondary mt-2">Restez à l'écoute</p>
          </div>
          {/* Widget Dons */}
          <div className="relative p-6 rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
            <div className="absolute top-4 right-4 text-secondary/20 group-hover:text-secondary/40 transition-colors">
              <Heart size={32} />
            </div>
            <p className="text-sm text-text-secondary font-medium">Total des dons</p>
            <p className="text-2xl font-bold text-text mt-3">
              {user.totalDonated.toLocaleString()} <span className="text-sm font-normal text-text-secondary">XOF</span>
            </p>
          </div>
          {/* Widget Niveau */}
          <div className="relative p-6 rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
            <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors">
              <TrendingUp size={32} />
            </div>
            <p className="text-sm text-text-secondary font-medium">Niveau</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-bold text-primary">{user.level}</span>
              <span className="text-lg text-text-secondary">·</span>
              <span className="text-lg text-text-secondary">{user.xp} XP</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${Math.min((user.xp % 1000) / 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChallengeWidget />
        <LiveWidget />
      </div>
    </div>
  );
}