import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

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