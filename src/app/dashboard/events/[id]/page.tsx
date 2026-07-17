import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { GroupDetailClient } from "./_components/GroupDetailClient";

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      },
      posts: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      creator: { select: { firstName: true, lastName: true } },
    },
  });
  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === session.user.id);

  // Serialization for PostCard
  const serializedPosts = group.posts.map((p) => ({
    id: p.id,
    content: p.content,
    mediaUrl: null,
    mediaType: null,
    createdAt: p.createdAt.toISOString(),
    userId: p.userId,
    user: {
      id: p.userId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      avatar: p.user.avatar,
      isPremium: false,
    },
    comments: [],
    likes: [],
    sharesCount: 0,
    sharedPost: null,
  }));

  const members = group.members.map((m) => ({
    id: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    avatar: m.user.avatar,
    role: m.role,
  }));

  return (
    <GroupDetailClient
      group={{
        id: group.id,
        name: group.name,
        description: group.description,
        imageUrl: group.imageUrl,
        memberCount: group.members.length,
        creatorName: `${group.creator.firstName} ${group.creator.lastName}`,
        posts: serializedPosts,
        members,
        isMember,
      }}
      currentUserId={session.user.id}
    />
  );
}