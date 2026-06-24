// src/app/dashboard/profile/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/dashboard/MemberCard";
import { PostCard } from "@/components/community/PostCard";
import { Users, MessageCircle, ThumbsUp, CalendarDays, Heart, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { ChallengeWidget } from "@/components/challenges/ChallengeWidget";
import { LiveWidget } from "@/components/live/LiveWidget";
import { RadioWidget } from "@/components/radio/RadioWidget";

export const dynamic = 'force-dynamic'; // Désactive le prérendu pour cette page

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) notFound();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      posts: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: true,
          comments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      badges: { include: { badge: true } },
      _count: { select: { posts: true, comments: true, donations: true } },
    },
  });

  if (!user) notFound();

  const friendsCount = await prisma.friendship.count({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      status: "ACCEPTED",
    },
  });

  // Récupération des relations familiales
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

  const serializedPosts = user.posts.map((post: any) => ({
    id: post.id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    createdAt: post.createdAt.toISOString(),
    userId: post.userId,
    user: {
      id: post.user.id,
      firstName: post.user.firstName,
      lastName: post.user.lastName,
      avatar: post.user.avatar,
    },
    comments: post.comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      userId: c.userId,
      user: {
        id: c.user.id,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        avatar: c.user.avatar,
      },
    })),
    likes: post.likes.map((l: any) => ({
      userId: l.userId,
      createdAt: l.createdAt.toISOString(),
    })),
    sharedPost: null,
  }));

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
      {/* En-tête profil */}
      <div className="relative card-premium p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/images/bg-pattern-bete.png')", backgroundSize: "cover" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {user.avatar ? (
            <img src={user.avatar} alt="Photo" className="w-24 h-24 rounded-full border-4 border-primary/30 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/30">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-display font-bold text-text">{user.firstName} {user.lastName}</h1>
            <p className="text-text-secondary">{user.email}</p>
            <p className="text-sm text-text-secondary mt-1">Niveau {user.level} · {user.xp} XP · Membre depuis {user.createdAt.getFullYear()}</p>
            <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start">
              <span className="flex items-center gap-1 text-text"><Users size={16} /> {friendsCount} amis</span>
              <span className="flex items-center gap-1 text-text"><MessageCircle size={16} /> {user._count.posts} publications</span>
              <span className="flex items-center gap-1 text-text"><ThumbsUp size={16} /> {user._count.comments} commentaires</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carte de membre enrichie */}
      <MemberCard
        user={memberCardUser}
        parents={familyData.parents || []}
        siblings={familyData.siblings || []}
      />

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RadioWidget />
        <div className="card-premium relative p-6 rounded-[var(--radius-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
          <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors"><CalendarDays size={32} /></div>
          <p className="text-sm text-text-secondary font-medium">Prochain événement</p>
          <p className="text-2xl font-bold text-text mt-3">Aucun</p>
          <p className="text-xs text-text-secondary mt-2">Restez à l'écoute</p>
        </div>
        <div className="card-premium relative p-6 rounded-[var(--radius-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
          <div className="absolute top-4 right-4 text-secondary/20 group-hover:text-secondary/40 transition-colors"><Heart size={32} /></div>
          <p className="text-sm text-text-secondary font-medium">Total des dons</p>
          <p className="text-2xl font-bold text-text mt-3">{user.totalDonated.toLocaleString()} <span className="text-sm font-normal text-text-secondary">XOF</span></p>
        </div>
        <div className="card-premium relative p-6 rounded-[var(--radius-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
          <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors"><TrendingUp size={32} /></div>
          <p className="text-sm text-text-secondary font-medium">Niveau</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold text-primary">{user.level}</span>
            <span className="text-lg text-text-secondary">·</span>
            <span className="text-lg text-text-secondary">{user.xp} XP</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${Math.min((user.xp % 1000) / 10, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Défis et Lives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChallengeWidget />
        <LiveWidget />
      </div>

      {/* Badges */}
      <div className="card-premium p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Badges</h2>
        {user.badges.length === 0 ? (
          <p className="text-text-secondary italic">Aucun badge pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {user.badges.map((ub: any) => (
              <div key={ub.id} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-2xl">{ub.badge.icon}</span>
                <div>
                  <p className="text-text text-sm font-medium">{ub.badge.name}</p>
                  <p className="text-text-secondary text-xs">{ub.badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publications de l'utilisateur */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Publications</h2>
        {serializedPosts.length === 0 ? (
          <p className="text-text-secondary italic">Aucune publication pour le moment.</p>
        ) : (
          <div className="space-y-6">
            {serializedPosts.map((post: any) => (
              <PostCard key={post.id} post={post} currentUserId={session.user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}