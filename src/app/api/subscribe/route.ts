import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Vérifier que la fonctionnalité est active
  const config = await prisma.pricingConfig.findUnique({ where: { featureKey: "premium_monthly" } });
  if (!config || !config.active) return NextResponse.json({ error: "Abonnement non disponible" }, { status: 400 });

  // Créer la session de paiement CinetPay
  const response = await fetch(`${req.headers.get("origin")}/api/donations/cinetpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: config.amount,
      network: "ALL",
      metadata: JSON.stringify({ type: "subscription", userId: session.user.id }),
    }),
  });
  const { url } = await response.json();
  return NextResponse.json({ url });
}