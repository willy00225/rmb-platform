import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Types autorisés pour le filtrage
const ALLOWED_TYPES = ["subscription", "boost", "donation"] as const;
type TransactionType = (typeof ALLOWED_TYPES)[number];

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") || "all";

    // Préparation du filtre
    const where: { type?: TransactionType } = {};

    if (typeParam !== "all") {
      // Validation : le type doit faire partie de la liste autorisée
      if (!ALLOWED_TYPES.includes(typeParam as TransactionType)) {
        return NextResponse.json(
          { error: `Type invalide. Types autorisés : ${ALLOWED_TYPES.join(", ")}` },
          { status: 400 }
        );
      }
      where.type = typeParam as TransactionType;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      transactions,
      total: transactions.length,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/admin/transactions :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des transactions" },
      { status: 500 }
    );
  }
}