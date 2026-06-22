import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const groups = await prisma.group.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(groups);
}

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
      { error: "Votre identité doit être vérifiée pour créer un groupe.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const group = await prisma.group.create({
    data: {
      name,
      description,
      creatorId: session.user.id,
      members: { create: { userId: session.user.id, role: "ADMIN" } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}