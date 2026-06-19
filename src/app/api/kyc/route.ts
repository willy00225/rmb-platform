import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { type, fileUrl } = await req.json();
  if (!type || !fileUrl) return NextResponse.json({ error: "Type et fichier requis" }, { status: 400 });

  // Vérifier qu'aucun document du même type n'est déjà en attente
  const existing = await prisma.kycDocument.findFirst({
    where: { userId: session.user.id, type, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Un document de ce type est déjà en attente" }, { status: 400 });

  const doc = await prisma.kycDocument.create({
    data: { userId: session.user.id, type, fileUrl },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const docs = await prisma.kycDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}