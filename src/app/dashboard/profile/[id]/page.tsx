import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PublicProfileClient } from "./_components/PublicProfileClient";
import { MessageButton } from "./MessageButton";
import { UserPlus, ArrowLeft, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  if (id === session.user.id) redirect("/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      coverImage: true,
      bio: true,
      email: true,
      phone: true,
      fonction: true,
      level: true,
      xp: true,
      createdAt: true,
      totalDonated: true,
      currentCity: true,
      currentCountry: true,
      village: true,
      canton: true,
      dateOfBirth: true,
      posts: {
        where: {
          visible: true,
          OR: [
            { visibility: "PUBLIC" },
          ],
        },
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
        take: 20,
      },
      badges: { include: { badge: true } },
      _count: { select: { posts: true, comments: true, donations: true } },
    },
  });

  if (!user) notFound();

  const sessionFriends = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id },
        { addresseeId: session.user.id },
      ],
      status: "ACCEPTED",
    },
    select: { requesterId: true, addresseeId: true },
  });
  const sessionFriendIds = sessionFriends.map(f =>
    f.requesterId === session.user.id ? f.addresseeId : f.requesterId
  );

  const userFriends = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: id },
        { addresseeId: id },
      ],
      status: "ACCEPTED",
    },
    select: { requesterId: true, addresseeId: true },
  });
  const userFriendIds = userFriends.map(f =>
    f.requesterId === id ? f.addresseeId : f.requesterId
  );

  const commonFriendIds = sessionFriendIds.filter(fid => userFriendIds.includes(fid));
  const commonFriends = commonFriendIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: commonFriendIds } },
        select: { id: true, firstName: true, lastName: true, avatar: true },
        take: 10,
      })
    : [];

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: id },
        { requesterId: id, addresseeId: session.user.id },
      ],
    },
  });

  const isPending = friendship?.status === "PENDING";
  const isAccepted = friendship?.status === "ACCEPTED";
  const isRequester = friendship?.requesterId === session.user.id;

  async function addFriendAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");
    await prisma.friendship.create({
      data: { requesterId: session.user.id, addresseeId: id, status: "PENDING" },
    });
    redirect(`/dashboard/profile/${id}`);
  }

  async function cancelRequestAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: id },
          { requesterId: id, addresseeId: session.user.id },
        ],
      },
    });
    if (friendship) {
      await prisma.friendship.delete({ where: { id: friendship.id } });
    }
    redirect(`/dashboard/profile/${id}`);
  }

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

  // Photos récentes : on garde uniquement les posts avec une image, puis on extrait l'ID et l'URL
  const recentPhotos = user.posts
    .filter(p => p.mediaUrl && p.mediaType === "image")
    .slice(0, 9)
    .map(p => ({ id: p.id, url: p.mediaUrl as string }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeInUp py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition">
        <ArrowLeft size={16} />
        Retour
      </Link>

      <div className="card-premium overflow-hidden !p-0">
        <div
          className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5 relative"
          style={
            user.coverImage
              ? { backgroundImage: `url(${user.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-16 relative z-10 flex flex-col items-center sm:flex-row sm:items-end gap-4">
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-surface bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            )}
          </div>
          <div className="text-center sm:text-left mt-4 sm:mt-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-text">
              {user.firstName} {user.lastName}
            </h1>
            {user.fonction && <p className="text-text-secondary text-sm">{user.fonction}</p>}
            {user.currentCity && (
              <p className="text-text-secondary text-xs mt-1">{user.currentCity}{user.currentCountry ? `, ${user.currentCountry}` : ""}</p>
            )}
          </div>

          <div className="flex gap-2 mt-4 sm:mt-0">
            {isAccepted ? (
              <>
                <MessageButton targetUserId={id} />
                <Button variant="secondary" size="sm" disabled>
                  <UserCheck size={16} className="mr-1" /> Amis
                </Button>
              </>
            ) : isPending && isRequester ? (
              <form action={cancelRequestAction}>
                <Button variant="secondary" size="sm" type="submit">
                  <UserX size={16} className="mr-1" /> Annuler l'invitation
                </Button>
              </form>
            ) : isPending && !isRequester ? (
              <Button variant="secondary" size="sm" disabled>
                <UserPlus size={16} className="mr-1" /> Invitation reçue
              </Button>
            ) : (
              <>
                <form action={addFriendAction}>
                  <Button variant="primary" size="sm" type="submit">
                    <UserPlus size={16} className="mr-1" /> Ajouter
                  </Button>
                </form>
                <MessageButton targetUserId={id} />
              </>
            )}
          </div>
        </div>
      </div>

      <PublicProfileClient
        userId={user.id}
        bio={user.bio}
        level={user.level}
        xp={user.xp}
        totalDonated={user.totalDonated}
        posts={serializedPosts}
        badges={user.badges.map((ub: any) => ({
          id: ub.id,
          name: ub.badge.name,
          description: ub.badge.description,
          icon: ub.badge.icon,
        }))}
        friendsCount={userFriendIds.length}
        commonFriends={commonFriends}
        commonFriendsCount={commonFriendIds.length}
        recentPhotos={recentPhotos}
        postCount={user._count.posts}
        commentCount={user._count.comments}
        donationCount={user._count.donations}
        currentUserId={session.user.id}
      />
    </div>
  );
}