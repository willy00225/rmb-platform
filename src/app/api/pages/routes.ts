import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Utilitaire de validation d'URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérification KYC et restrictions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true, restrictedUntil: true, role: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour créer une page.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }
  if (user.restrictedUntil && new Date() < user.restrictedUntil) {
    return NextResponse.json({ error: "Vous êtes temporairement restreint." }, { status: 403 });
  }
  if (user.role === "SUSPENDED") {
    return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
  }

  // Limite de pages (5 par utilisateur)
  const pageCount = await prisma.page.count({ where: { creatorId: session.user.id } });
  if (pageCount >= 5) {
    return NextResponse.json({ error: "Vous avez atteint la limite de 5 pages." }, { status: 403 });
  }

  // Récupération et validation des données
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { name, description, imageUrl, coverImage, whatsappNumber, website, location, category } = body;

  // Validation du nom
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Le nom de la page est requis" }, { status: 400 });
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return NextResponse.json({ error: "Le nom de la page doit comporter au moins 2 caractères." }, { status: 400 });
  }
  if (trimmedName.length > 75) {
    return NextResponse.json({ error: "Le nom de la page ne peut pas dépasser 75 caractères." }, { status: 400 });
  }

  // Validation des URLs
  if (imageUrl && !isValidUrl(imageUrl)) {
    return NextResponse.json({ error: "L'URL de l'image est invalide." }, { status: 400 });
  }
  if (coverImage && !isValidUrl(coverImage)) {
    return NextResponse.json({ error: "L'URL de la bannière est invalide." }, { status: 400 });
  }
  if (website && !isValidUrl(website)) {
    return NextResponse.json({ error: "L'URL du site web est invalide." }, { status: 400 });
  }

  // Validation WhatsApp (format international sans le +)
  if (whatsappNumber && !/^\d{7,15}$/.test(whatsappNumber.replace(/\D/g, ''))) {
    return NextResponse.json({ error: "Le numéro WhatsApp n'est pas valide." }, { status: 400 });
  }

  // Limitation des longueurs
  if (description && description.length > 1000) {
    return NextResponse.json({ error: "La description ne peut pas dépasser 1000 caractères." }, { status: 400 });
  }
  if (location && location.length > 150) {
    return NextResponse.json({ error: "La localisation est trop longue." }, { status: 400 });
  }

  // Catégories autorisées
  const allowedCategories = [
    "Entreprise", "Média / Actualité", "Artiste / Groupe", "Association",
    "Éducation", "Santé", "Commerce", "Marque", "Personnage public", "Autre"
  ];
  if (category && !allowedCategories.includes(category)) {
    return NextResponse.json({ error: "Catégorie non reconnue." }, { status: 400 });
  }

  // Anti-spam : max 3 pages par heure
  const recentPages = await prisma.page.count({
    where: {
      creatorId: session.user.id,
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });
  if (recentPages >= 3) {
    return NextResponse.json({ error: "Vous avez créé trop de pages récemment. Veuillez patienter." }, { status: 429 });
  }

  const page = await prisma.page.create({
    data: {
      name: trimmedName,
      description: description?.trim(),
      imageUrl,
      coverImage,
      whatsappNumber: whatsappNumber?.trim(),
      website: website?.trim(),
      location: location?.trim(),
      category,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(page, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pages = await prisma.page.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { posts: true, followers: true },
      },
    },
    take: 50,
  });

  return NextResponse.json(pages);
}