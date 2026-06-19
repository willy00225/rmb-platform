import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StreamChat } from "stream-chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const roomId = `rmb-live-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Créer un canal Stream dédié pour le chat du live
  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );
  const channelId = `live-${roomId}`;
  const channel = serverClient.channel("messaging", channelId, {
    created_by_id: session.user.id,
    members: [session.user.id],
  });
  await channel.create();
  // Mettre à jour le nom après coup (propriété non autorisée dans le 3e argument)
  await channel.update({ name: title } as any);

  // Sauvegarder le live
  const live = await prisma.live.create({
    data: {
      title,
      description,
      roomId,
      hostId: session.user.id,
      channelId,       // maintenant reconnu
      status: "LIVE",
    },
  });

  return NextResponse.json({
    liveId: live.id,
    roomId: live.roomId,
    channelId: live.channelId,
    url: `/dashboard/live/${live.id}`,
  });
}

export async function GET(req: Request) {
  const lives = await prisma.live.findMany({
    where: { status: "LIVE" },
    include: { host: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lives);
}