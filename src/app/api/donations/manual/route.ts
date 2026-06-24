import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { amount, network, phone } = await req.json();
  if (!amount || amount < 500) return NextResponse.json({ error: "Montant minimum 500 XOF" }, { status: 400 });
  if (!network) return NextResponse.json({ error: "Réseau requis" }, { status: 400 });

  const donation = await prisma.manualDonation.create({
    data: {
      userId: session.user.id,
      amount,
      network,
      phone,
    },
  });

  return NextResponse.json({ success: true, donation }, { status: 201 });
}
