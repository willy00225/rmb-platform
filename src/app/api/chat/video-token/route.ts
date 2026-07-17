import { NextResponse } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const secret = process.env.STREAM_VIDEO_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 }
    );
  }

  try {
    const token = jwt.sign(
      {
        user_id: userId,
        iat: Math.floor(Date.now() / 1000),
      },
      secret,
      {
        algorithm: "HS256",
        expiresIn: "1h",
      }
    );

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Erreur génération token vidéo :", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du token" },
      { status: 500 }
    );
  }
}