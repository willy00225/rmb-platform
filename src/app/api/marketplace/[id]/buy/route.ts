import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: params.id },
  });
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas acheter votre propre produit" }, { status: 400 });
  }

  // Vérifier si déjà vendu
  const existingPurchase = await prisma.marketplacePurchase.findFirst({
    where: { productId: params.id },
  });
  if (existingPurchase) {
    return NextResponse.json({ error: "Produit déjà vendu" }, { status: 400 });
  }

  // Appel à l’API CinetPay pour créer la session de paiement
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/donations/cinetpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: product.price,
      network: "ALL",
      metadata: JSON.stringify({
        type: "marketplace",
        productId: product.id,
        userId: session.user.id,
      }),
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json({ error: err.error || "Erreur de paiement" }, { status: 500 });
  }
  const { url } = await response.json();
  return NextResponse.json({ url });
}