import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Authentification requise (sinon on ne sait pas qui demande)
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ✅ Vérification KYC (décommentez si vous voulez bloquer l'accès)
  // const user = await prisma.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { kycLevel: true },
  // });
  // if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
  //   return NextResponse.json(
  //     { error: "Votre identité doit être vérifiée pour consulter vos commandes.", code: "KYC_REQUIRED" },
  //     { status: 403 }
  //   );
  // }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const userId = url.searchParams.get("userId");

  // Sécurité : un utilisateur ne peut voir que ses propres commandes
  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  if (type === "buyer") {
    const purchases = await prisma.marketplacePurchase.findMany({
      where: { buyerId: userId },
      include: { product: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases);
  } else {
    const sales = await prisma.marketplacePurchase.findMany({
      where: { sellerId: userId },
      include: { product: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales);
  }
}
