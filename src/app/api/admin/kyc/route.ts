// src/app/api/admin/kyc/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { sendEmail } from "@/lib/email";
import { kycApprovedEmail } from "@/emails/kycApproved";
import { kycRejectedEmail } from "@/emails/kycRejected";
import { KycLevel } from "@prisma/client";

// Helper pour récupérer la configuration du site (logo, couleurs)
async function getSiteConfigMap(): Promise<Record<string, string>> {
  const configs = await prisma.siteConfig.findMany();
  const map: Record<string, string> = {};
  for (const cfg of configs) map[cfg.key] = cfg.value;
  return map;
}

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

  // Récupération de l'utilisateur pour le nom et l'email
  const user = await prisma.user.findUnique({
    where: { id: doc.userId },
    select: { id: true, firstName: true, email: true },
  });

  const configMap = await getSiteConfigMap();
  const logoUrl = configMap["site_logo"] || "https://rmb-asso.org/images/logo-rmb.png";
  const primaryColor = configMap["site_primary_color"] || "#005A3A";
  const secondaryColor = configMap["site_secondary_color"] || "#C99619";

  if (action === "approve") {
    await prisma.kycDocument.update({
      where: { id: documentId },
      data: { status: "APPROVED", adminNote },
    });

    // Mise à jour du niveau KYC
    const approvedDocs = await prisma.kycDocument.findMany({
      where: { userId: doc.userId, status: "APPROVED" },
      select: { type: true },
    });
    const types = approvedDocs.map(d => d.type);
    let newLevel: KycLevel = KycLevel.PHONE;
    if (types.includes("ID_CARD") && types.includes("SELFIE")) newLevel = KycLevel.ID_VERIFIED;
    await prisma.user.update({ where: { id: doc.userId }, data: { kycLevel: newLevel } });

    // Notification push
    await sendPushNotification({
      headings: { fr: "KYC approuvé ✅" },
      contents: { fr: "Votre document a été validé." },
      includeExternalUserIds: [doc.userId],
    });

    // Email de confirmation
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Votre identité a été vérifiée – RMB Connect",
        html: kycApprovedEmail(user.firstName, logoUrl, primaryColor, secondaryColor),
      }).catch(err => console.error("Erreur envoi email approve KYC :", err));
    }
  } else if (action === "reject") {
    await prisma.kycDocument.update({
      where: { id: documentId },
      data: { status: "REJECTED", adminNote },
    });

    // Notification push
    await sendPushNotification({
      headings: { fr: "KYC rejeté ❌" },
      contents: { fr: `Motif: ${adminNote || "Document non conforme"}` },
      includeExternalUserIds: [doc.userId],
    });

    // Email de rejet
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Votre demande de vérification a été rejetée – RMB Connect",
        html: kycRejectedEmail(
          user.firstName,
          adminNote || "Les documents fournis ne sont pas conformes.",
          logoUrl,
          primaryColor,
          secondaryColor
        ),
      }).catch(err => console.error("Erreur envoi email reject KYC :", err));
    }
  }

  return NextResponse.json({ success: true });
}
