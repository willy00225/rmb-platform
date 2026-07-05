import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  // ✅ Nouveau format : soumission des trois documents en une fois
  if (body.frontFileUrl && body.backFileUrl && body.selfieFileUrl) {
    const userId = session.user.id;

    // Vérifier qu'aucun document n'est déjà en attente pour cet utilisateur
    const pendingDocs = await prisma.kycDocument.findMany({
      where: { userId, status: "PENDING" },
      select: { type: true },
    });
    const pendingTypes = pendingDocs.map(d => d.type);

    const conflicts = [];
    if (pendingTypes.includes("ID_CARD_FRONT")) conflicts.push("Recto");
    if (pendingTypes.includes("ID_CARD_BACK")) conflicts.push("Verso");
    if (pendingTypes.includes("SELFIE")) conflicts.push("Selfie");

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: `Vous avez déjà des documents en attente : ${conflicts.join(", ")}. Veuillez attendre leur traitement.` },
        { status: 400 }
      );
    }

    // Créer les trois documents en parallèle
    await prisma.kycDocument.createMany({
      data: [
        { userId, type: "ID_CARD_FRONT", fileUrl: body.frontFileUrl },
        { userId, type: "ID_CARD_BACK", fileUrl: body.backFileUrl },
        { userId, type: "SELFIE", fileUrl: body.selfieFileUrl },
      ],
    });

    const docs = await prisma.kycDocument.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    return NextResponse.json(docs, { status: 201 });
  }

  // ✅ Ancien format (rétrocompatibilité) : un seul document
  const { type, fileUrl } = body;
  if (!type || !fileUrl) {
    return NextResponse.json(
      { error: "Format invalide. Fournissez soit trois documents (frontFileUrl, backFileUrl, selfieFileUrl), soit type et fileUrl." },
      { status: 400 }
    );
  }

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