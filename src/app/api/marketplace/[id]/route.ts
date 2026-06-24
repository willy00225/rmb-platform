import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ Authentification obligatoire
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // ✅ Vérification KYC (décommentez si nécessaire)
  // const user = await prisma.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { kycLevel: true },
  // });
  // if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
  //   return NextResponse.json(
  //     { error: "Votre identité doit être vérifiée pour voir les détails d’un produit.", code: "KYC_REQUIRED" },
  //     { status: 403 }
  //   );
  // }

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json(product);
}