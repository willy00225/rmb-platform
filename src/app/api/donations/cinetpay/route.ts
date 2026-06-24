import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateChallenges } from "@/lib/challenges";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { amount, network } = await req.json();
  if (!amount || amount < 500) return NextResponse.json({ error: "Montant minimum 500 XOF" }, { status: 400 });

  const transactionId = `RMB-${Date.now()}`;
  const payload = {
    apikey: process.env.CINETPAY_API_KEY!,
    site_id: process.env.CINETPAY_SITE_ID!,
    transaction_id: transactionId,
    amount,
    currency: "XOF",
    description: `Don RMB Connect - ${session.user.name}`,
    customer_name: session.user.name || "Donateur",
    customer_email: session.user.email || "",
    customer_phone: "", // Optionnel
    channels: network || "ALL", // ALL pour proposer tous les moyens
    return_url: `${req.headers.get("origin")}/dashboard/donations?success=true`,
    notify_url: `${req.headers.get("origin")}/api/donations/cinetpay/webhook`,
    metadata: JSON.stringify({ userId: session.user.id }), // Permet de récupérer l'ID au retour
  };

  const response = await fetch("https://api.cinetpay.com/v1/?method=checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.code === "200") {
    // Mise à jour des défis en cours (dons)
    await updateChallenges("donations");
    return NextResponse.json({ url: data.data.payment_url });
  } else {
    return NextResponse.json({ error: data.message }, { status: 400 });
  }
}
