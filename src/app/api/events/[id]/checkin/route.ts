import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  // Vérifier que l'utilisateur est bien inscrit
  const participation = await prisma.participation.findFirst({
    where: { eventId: params.id, userId },
  });
  if (!participation) return NextResponse.json({ error: "Utilisateur non inscrit" }, { status: 404 });

  // Enregistrer le check-in (ou mettre à jour le statut)
  await prisma.participation.update({
    where: { id: participation.id },
    data: { status: "PRESENT" },
  });

  // Créditer XP
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: 50 } }, // 50 XP par check-in
  });

  return NextResponse.json({ success: true });
}