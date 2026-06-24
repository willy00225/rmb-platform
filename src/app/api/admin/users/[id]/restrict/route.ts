import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: userId } = await params;
  const { action, reason, duration } = await req.json();

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (action === "restrict") {
    const until = new Date();
    until.setDate(until.getDate() + (duration || 7));
    await prisma.user.update({
      where: { id: userId },
      data: { restrictedUntil: until },
    });
    await sendPushNotification({
      headings: { fr: "Restriction temporaire" },
      contents: { fr: `Vous êtes restreint de publication jusqu'au ${until.toLocaleDateString("fr-FR")}. Raison : ${reason || "Non spécifiée"}` },
      includeExternalUserIds: [userId],
    });
  } else if (action === "ban") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "SUSPENDED", banReason: reason },
    });
    await sendPushNotification({
      headings: { fr: "Compte suspendu" },
      contents: { fr: `Votre compte a été suspendu. Raison : ${reason || "Non spécifiée"}` },
      includeExternalUserIds: [userId],
    });
  } else if (action === "unrestrict") {
    await prisma.user.update({
      where: { id: userId },
      data: { restrictedUntil: null, banReason: null, role: "MEMBER" },
    });
    await sendPushNotification({
      headings: { fr: "Restriction levée" },
      contents: { fr: "Vos restrictions ont été levées. Vous pouvez à nouveau publier." },
      includeExternalUserIds: [userId],
    });
  }

  return NextResponse.json({ success: true });
}