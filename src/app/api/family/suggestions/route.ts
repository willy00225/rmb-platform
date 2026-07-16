import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, village: true, city: true, fonction: true },
  });
  if (!currentUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Amis déjà existants (pour ne pas les suggérer)
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      status: "ACCEPTED",
    },
  });
  const existingFriendIds = new Set(
    friendships.map(f => (f.requesterId === session.user.id ? f.addresseeId : f.requesterId))
  );
  existingFriendIds.add(session.user.id);

  // Amis d'amis
  const friendIds = Array.from(existingFriendIds);
  const friendsOfFriends = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: { in: friendIds } },
        { addresseeId: { in: friendIds } },
      ],
      status: "ACCEPTED",
    },
  });
  const friendsOfFriendsIds = new Set<string>();
  for (const f of friendsOfFriends) {
    const candidate =
      f.requesterId === session.user.id || existingFriendIds.has(f.requesterId)
        ? f.addresseeId
        : f.requesterId;
    if (!existingFriendIds.has(candidate)) friendsOfFriendsIds.add(candidate);
  }

  // Même village ou ville
  const localUsers = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(existingFriendIds) },
      OR: [
        { village: currentUser.village || undefined },
        { city: currentUser.city || undefined },
      ],
    },
    select: { id: true, firstName: true, lastName: true, avatar: true, village: true, city: true },
    take: 20,
  });

  const suggestionsMap = new Map<
    string,
    { id: string; firstName: string; lastName: string; avatar: string | null; reason: string }
  >();

  // Amis d'amis
  if (friendsOfFriendsIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(friendsOfFriendsIds) } },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });
    for (const u of users) {
      suggestionsMap.set(u.id, { ...u, reason: "Ami d'ami" });
    }
  }

  // Même localité
  for (const u of localUsers) {
    if (!suggestionsMap.has(u.id)) {
      const reason =
        u.village === currentUser.village
          ? `Même village (${u.village})`
          : `Même ville (${u.city})`;
      suggestionsMap.set(u.id, { ...u, reason });
    }
  }

  // Même profession
  if (currentUser.fonction) {
    const sameJob = await prisma.user.findMany({
      where: {
        fonction: currentUser.fonction,
        id: { notIn: Array.from(existingFriendIds) },
      },
      select: { id: true, firstName: true, lastName: true, avatar: true },
      take: 10,
    });
    for (const u of sameJob) {
      if (!suggestionsMap.has(u.id)) {
        suggestionsMap.set(u.id, { ...u, reason: `Même profession (${currentUser.fonction})` });
      }
    }
  }

  const suggestions = Array.from(suggestionsMap.values()).slice(0, 15);
  return NextResponse.json(suggestions);
}