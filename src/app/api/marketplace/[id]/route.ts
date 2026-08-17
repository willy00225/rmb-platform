import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que le produit existe et appartient à l'utilisateur
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  if (product.userId !== session.user.id) {
    return NextResponse.json({ error: "Vous n'êtes pas le propriétaire" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { title, description, price, category, images, location, condition } = body;

    const data: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Titre invalide" }, { status: 400 });
      }
      data.title = title.trim();
    }

    if (description !== undefined) {
      data.description = String(description)
        .replace(/\u00A0/g, " ")
        .replace(/[\r\n]+/g, " ")
        .trim();
    }

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
      }
      data.price = numericPrice;
    }

    if (category !== undefined) {
      data.category = category || "autre";
    }

    if (images !== undefined) {
      data.images = Array.isArray(images) ? images.filter((url: any) => typeof url === "string") : [];
    }

    if (location !== undefined) {
      data.location = location ? String(location).trim() : null;
    }

    if (condition !== undefined) {
      data.condition = condition || "new";
    }

    const updated = await prisma.marketplaceProduct.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/marketplace:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}