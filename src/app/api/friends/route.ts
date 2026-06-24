import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FriendshipStatus } from "@prisma/client";

// GET : lister mes amis (acceptés) — pas de KYC requis
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "ACCEPTED";

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id, status: status as FriendshipStatus },
        { addresseeId: session.user.id, status: status as FriendshipStatus },
      ],
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      addressee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  const friends = friendships.map(f => {
    const isRequester = f.requesterId === session.user.id;
    return {
      id: f.id,
      friend: isRequester ? f.addressee : f.requester,
      status: f.status,
      createdAt: f.createdAt,
    };
  });

  return NextResponse.json(friends);
}

// POST : envoyer une invitation
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour envoyer une invitation.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { addresseeId } = await req.json();
  if (!addresseeId) return NextResponse.json({ error: "Destinataire requis" }, { status: 400 });
  if (addresseeId === session.user.id) return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter vous-même" }, { status: 400 });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: session.user.id },
      ],
    },
  });
  if (existing) {
    if (existing.status === "PENDING") return NextResponse.json({ error: "Invitation déjà envoyée" }, { status: 400 });
    if (existing.status === "ACCEPTED") return NextResponse.json({ error: "Déjà amis" }, { status: 400 });
    if (existing.status === "BLOCKED") return NextResponse.json({ error: "Impossible" }, { status: 400 });
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: session.user.id,
      addresseeId,
    },
  });

  return NextResponse.json(friendship, { status: 201 });
}