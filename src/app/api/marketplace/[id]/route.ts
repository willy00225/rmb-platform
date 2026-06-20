import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json(product);
}