import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { StreamChat } from "stream-chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { friendId } = await req.json();
  if (!friendId) return NextResponse.json({ error: "Ami requis" }, { status: 400 });

  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const members = [session.user.id, friendId].sort();
  const channelId = `private-${members[0]}-${members[1]}`;

  const channel = serverClient.channel("messaging", channelId, {
    members: [session.user.id, friendId],
    created_by_id: session.user.id,
  });

  try {
    // Si le canal n'existe pas encore, on le crée
    await channel.create();
  } catch (err: unknown) {
    // S'il existe déjà, une erreur est levée, ce n'est pas grave
    const error = err as { message?: string };
    if (!error.message?.includes("already exists")) {
      console.error("Erreur création canal privé :", err);
    }
  }

  return NextResponse.json({ channelId: channel.id });
}