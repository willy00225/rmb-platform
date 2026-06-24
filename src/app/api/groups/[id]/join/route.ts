import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: groupId } = await params;

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour rejoindre un groupe.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "Déjà membre" }, { status: 400 });

  await prisma.groupMember.create({
    data: { groupId, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}