import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const live = await prisma.live.findUnique({
    where: { id },
    select: { hostId: true },
  });

  if (!live) {
    return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
  }

  if (live.hostId !== session.user.id) {
    return NextResponse.json({ error: "Seul l'hôte peut terminer ce live" }, { status: 403 });
  }

  await prisma.live.update({
    where: { id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}