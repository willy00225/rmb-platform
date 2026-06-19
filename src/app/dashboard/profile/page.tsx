import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/dashboard/MemberCard";
import { PostCard } from "@/components/community/PostCard";
import { Users, MessageCircle, ThumbsUp } from "lucide-react";
import { notFound } from "next/navigation";
import { PreferencesSection } from "@/components/profile/PreferencesSection";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) notFound();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      posts: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          likes: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
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

  // Récupération directe des relations familiales (sans fetch API)
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

  // Sérialisation des posts
  const serializedPosts = user.posts.map((post) => ({
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
    comments: post.comments.map((c) => ({
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
    likes: post.likes.map((l) => ({
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
      <div className="relative rounded-[var(--radius-card)] bg-white border border-border p-8 overflow-hidden shadow-[var(--shadow-card)]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/bg-pattern-bete.png')",
            backgroundSize: "cover",
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {user.avatar ? (
            <img src={user.avatar} alt="Photo" className="w-24 h-24 rounded-full border-4 border-primary/30 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/30">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-display font-bold text-text">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-text-secondary">{user.email}</p>
            <p className="text-sm text-text-secondary mt-1">
              Niveau {user.level} · {user.xp} XP · Membre depuis {user.createdAt.getFullYear()}
            </p>
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

      {/* Préférences (thème) */}
      <PreferencesSection />

      {/* Badges */}
      <div className="rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Badges</h2>
        {user.badges.length === 0 ? (
          <p className="text-text-secondary italic">Aucun badge pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {user.badges.map((ub) => (
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

      {/* Publications */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Publications</h2>
        {serializedPosts.length === 0 ? (
          <p className="text-text-secondary italic">Aucune publication pour le moment.</p>
        ) : (
          <div className="space-y-6">
            {serializedPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={session.user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}