import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // ✅ Vérification KYC avant tout achat de boost
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycLevel: true },
    });
    if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
      return NextResponse.json(
        {
          error: "Votre identité doit être vérifiée avant d'acheter des boosts.",
          code: "KYC_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { boostType } = body; // ex: "single", "pack5", "pack10"

    // Déterminer la clé de configuration en fonction du type de boost
    let featureKey = "boost_single";
    if (boostType === "pack5") featureKey = "boost_pack5";
    else if (boostType === "pack10") featureKey = "boost_pack10";

    // Vérifier que la fonctionnalité est active
    const config = await prisma.pricingConfig.findUnique({
      where: { featureKey },
    });

    if (!config || !config.active) {
      return NextResponse.json(
        { error: "Cette option de boost n'est pas disponible" },
        { status: 400 }
      );
    }

    // Créer la session de paiement CinetPay
    const response = await fetch(`${req.headers.get("origin")}/api/donations/cinetpay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: config.amount,
        network: "ALL",
        metadata: JSON.stringify({
          type: "boost",
          boostType,
          userId: session.user.id,
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Erreur lors de la création du paiement" },
        { status: response.status }
      );
    }

    const { url } = await response.json();
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erreur API boost/buy:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'achat du boost" },
      { status: 500 }
    );
  }
}
