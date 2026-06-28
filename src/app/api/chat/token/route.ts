import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { StreamChat } from "stream-chat";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const serverClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    // Crée un token avec un rôle admin si l'utilisateur est admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    
    // Utilise la méthode createToken(userId) qui retourne un token simple
    // Si tu veux ajouter un rôle, il faut upsert l'utilisateur d'abord
    if (isAdmin) {
      await serverClient.upsertUser({
        id: session.user.id,
        name: session.user.name || "Admin",
        role: "admin",
      });
    } else {
      await serverClient.upsertUser({
        id: session.user.id,
        name: session.user.name || "Membre",
        role: "user",
      });
    }

    const token = serverClient.createToken(session.user.id);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Erreur token chat :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}