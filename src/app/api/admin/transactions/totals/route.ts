import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface TotalsResponse {
  all: number;
  subscription: number;
  boost: number;
  donation: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const [all, subscription, boost, donation] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "subscription" },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "boost" },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "donation" },
      }),
    ]);

    const totals: TotalsResponse = {
      all: all._sum.amount || 0,
      subscription: subscription._sum.amount || 0,
      boost: boost._sum.amount || 0,
      donation: donation._sum.amount || 0,
    };

    return NextResponse.json(totals);
  } catch (error: any) {
    console.error("Erreur GET /api/admin/transactions/totals :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du calcul des totaux" },
      { status: 500 }
    );
  }
}