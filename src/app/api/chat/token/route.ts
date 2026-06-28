import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { StreamChat } from "stream-chat";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  // Détermine le rôle Stream en fonction du rôle NextAuth
  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const streamRole = isAdmin ? "admin" : "user";

  // Crée le token avec le rôle explicite (utilisation de any pour contourner le typage strict)
  const token = (serverClient as any).createToken(session.user.id, {
    role: streamRole,
  });

  return NextResponse.json({ token });
}