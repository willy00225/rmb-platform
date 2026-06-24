import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const podcasts = await prisma.podcast.findMany({
    orderBy: { createdAt: "desc" },
    include: { addedBy: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json(podcasts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, url } = await req.json();
  if (!title || !url) return NextResponse.json({ error: "Titre et URL requis" }, { status: 400 });

  const podcast = await prisma.podcast.create({
    data: { title, url, addedById: session.user.id },
  });

  return NextResponse.json(podcast, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.podcast.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
