import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { KycLevel } from "@prisma/client"; // Import de l'enum

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const docs = await prisma.kycDocument.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { documentId, action, adminNote } = await req.json(); // action: "approve" | "reject"
  const doc = await prisma.kycDocument.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  if (action === "approve") {
    await prisma.kycDocument.update({ where: { id: documentId }, data: { status: "APPROVED", adminNote } });
    // Mettre à jour le niveau KYC de l'utilisateur si tous les documents requis sont approuvés (ex: ID + selfie)
    const approvedDocs = await prisma.kycDocument.findMany({
      where: { userId: doc.userId, status: "APPROVED" },
      select: { type: true },
    });
    const types = approvedDocs.map(d => d.type);
    let newLevel: KycLevel = KycLevel.PHONE; // Utilisation de l'enum
    if (types.includes("ID_CARD") && types.includes("SELFIE")) newLevel = KycLevel.ID_VERIFIED;
    // Pour AMBASSADOR, il faut une validation manuelle supplémentaire
    await prisma.user.update({ where: { id: doc.userId }, data: { kycLevel: newLevel } });

    await sendPushNotification({
      headings: { fr: "KYC approuvé ✅" },
      contents: { fr: "Votre document a été validé." },
      includeExternalUserIds: [doc.userId],
    });
  } else if (action === "reject") {
    await prisma.kycDocument.update({ where: { id: documentId }, data: { status: "REJECTED", adminNote } });
    await sendPushNotification({
      headings: { fr: "KYC rejeté ❌" },
      contents: { fr: `Motif: ${adminNote || "Document non conforme"}` },
      includeExternalUserIds: [doc.userId],
    });
  }

  return NextResponse.json({ success: true });
}