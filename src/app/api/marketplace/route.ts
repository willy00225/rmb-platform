import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 12;

    const where: Record<string, unknown> = { status: "active" };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.marketplaceProduct.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceProduct.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const message = (error as Error).message || "Erreur inconnue";
    console.error("Erreur GET /api/marketplace:", error);
    return NextResponse.json({ error: "Erreur serveur", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérification KYC
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycLevel: true },
    });
    if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
      return NextResponse.json(
        { error: "Votre identité doit être vérifiée pour publier une annonce.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { title, description, price, category, images, location, condition } = body;

    // Normalisation et validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: "Le prix est requis et doit être un nombre" }, { status: 400 });
    }

    const product = await prisma.marketplaceProduct.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description ? String(description) : "",
        price: Number(price),          // conversion en nombre
        category: category || "autre",
        images: Array.isArray(images) ? images.map(String) : [],  // s'assurer que c'est un tableau de strings
        location: location ? String(location) : null,
        condition: condition || "new",
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = (error as Error).message || "Erreur inconnue";
    console.error("Erreur POST /api/marketplace:", error);
    return NextResponse.json({ error: "Erreur serveur", details: message }, { status: 500 });
  }
}