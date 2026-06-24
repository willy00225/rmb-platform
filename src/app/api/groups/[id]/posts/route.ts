import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const posts = await prisma.groupPost.findMany({
    where: { groupId },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

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
      { error: "Votre identité doit être vérifiée pour publier dans un groupe.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { content, mediaUrl } = await req.json();
  if (!content) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const post = await prisma.groupPost.create({
    data: { groupId, userId: session.user.id, content, mediaUrl },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  });

  return NextResponse.json(post, { status: 201 });
}