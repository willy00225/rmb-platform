import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "Déjà membre" }, { status: 400 });

  await prisma.groupMember.create({
    data: { groupId: params.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}