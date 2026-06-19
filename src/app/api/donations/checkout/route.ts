import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount < 500) return NextResponse.json({ error: "Montant minimum 500 XOF" }, { status: 400 });

  const origin = req.headers.get("origin") || "http://localhost:3001";

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "xof",
          product_data: {
            name: "Don à RMB Connect",
            description: "Soutenez le Réseau Mondial des Bétés",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/dashboard/donations?success=true`,
    cancel_url: `${origin}/dashboard/donations?canceled=true`,
    metadata: {
      userId: session.user.id,
    },
  });

  return NextResponse.json({ url: stripeSession.url });
}