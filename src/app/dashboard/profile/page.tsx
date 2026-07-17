import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileClient } from "./_components/ProfileClient";

export const dynamic = 'force-dynamic';

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
      pageFollows: {
        include: { page: { select: { id: true, name: true, imageUrl: true } } },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const friendsCount = await prisma.friendship.count({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      status: "ACCEPTED",
    },
  });

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      status: "ACCEPTED",
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      addressee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) =>
    f.requesterId === user.id ? f.addressee : f.requester
  );

  const relations = await prisma.familyRelation.findMany({
    where: {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
    },
    include: {
      fromUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      toUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  const familyData = {
    parents: relations.filter(r => r.relation === "parent").map(r => r.fromUserId === user.id ? r.toUser : r.fromUser),
    children: relations.filter(r => r.relation === "child").map(r => r.fromUserId === user.id ? r.toUser : r.fromUser),
    spouses: relations.filter(r => r.relation === "spouse").map(r => r.fromUserId === user.id ? r.toUser : r.fromUser),
    siblings: relations.filter(r => r.relation === "sibling").map(r => r.fromUserId === user.id ? r.toUser : r.fromUser),
  };

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
    likes: post.likes.map((l: any) => ({ userId: l.userId, createdAt: l.createdAt.toISOString() })),
    sharedPost: null,
  }));

  const recentPhotos = user.posts
    .filter((p: any) => p.mediaUrl && p.mediaType === "image")
    .slice(0, 9)
    .map((p: any) => ({ id: p.id, url: p.mediaUrl }));

  return (
    <ProfileClient
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? "",
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
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
        totalDonated: user.totalDonated,
      }}
      friendsCount={friendsCount}
      posts={serializedPosts}
      badges={user.badges.map((ub: any) => ({
        id: ub.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
      }))}
      familyData={familyData}
      recentPhotos={recentPhotos}
      friendsPreview={friends}
      followedPages={user.pageFollows.map((pf: any) => pf.page)}
      postCount={user._count.posts}
      commentCount={user._count.comments}
      donationCount={user._count.donations}
      currentUserId={session.user.id}
    />
  );
}