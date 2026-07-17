import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostVisibility, FriendshipStatus } from "@prisma/client";

// Utilitaire de validation d'URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Validation d'un UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Valider le format de l'ID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const session = await auth();

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      _count: {
        select: { posts: true, followers: true },
      },
      followers: session?.user?.id
        ? {
            where: { userId: session.user.id },
            select: { id: true },
          }
        : false,
      posts: {
        where: {
          OR: [
            { visible: true, visibility: PostVisibility.PUBLIC },
            ...(session?.user?.id
              ? [
                  { userId: session.user.id },
                  {
                    visibility: PostVisibility.FRIENDS,
                    user: {
                      OR: [
                        {
                          friendshipsRequested: {
                            some: { addresseeId: session.user.id, status: FriendshipStatus.ACCEPTED },
                          },
                        },
                        {
                          friendshipsReceived: {
                            some: { requesterId: session.user.id, status: FriendshipStatus.ACCEPTED },
                          },
                        },
                      ],
                    },
                  },
                ]
              : []),
          ],
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          comments: {
            where: { parentId: null },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              likes: { select: { userId: true } },
              replies: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                  likes: { select: { userId: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          likes: { select: { userId: true } },
          sharedPost: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
          },
          _count: {
            select: { sharedBy: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limiter le nombre de posts retournés
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  // Ne pas exposer si la page est suspendue (sauf pour le créateur ou admin)
  if (page.suspended) {
    const isCreatorOrAdmin = session?.user?.id === page.creatorId ||
      (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN");
    if (!isCreatorOrAdmin) {
      return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
    }
  }

  const isFollowing = Array.isArray(page.followers) ? page.followers.length > 0 : false;

  const serialized = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    isFollowing,
    followers: undefined,
    posts: (page.posts as any[]).map((post: any) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      sharesCount: post._count.sharedBy,
      comments: post.comments.map((c: any) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        replies: c.replies.map((r: any) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    })),
  };

  return NextResponse.json(serialized);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: pageId } = await params;

  // Valider le format de l'ID
  if (!isValidUUID(pageId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  // Récupérer la page et vérifier les droits
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }

  // Vérifier que la page n'est pas suspendue (seul un admin plateforme peut modifier une page suspendue)
  if (page.suspended && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cette page est suspendue, modifications impossibles." }, { status: 403 });
  }

  const isCreator = page.creatorId === session.user.id;
  const memberRole = page.members[0]?.role;
  const isAdmin = memberRole === "ADMIN";

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
  }

  // Parser et valider les données
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const {
    name,
    description,
    category,
    website,
    location,
    whatsappNumber,
    imageUrl,
    coverImage,
  } = body;

  // Données de mise à jour filtrées
  const updateData: Record<string, any> = {};

  // Validation du nom
  if (name !== undefined) {
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom de la page est requis." }, { status: 400 });
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ error: "Le nom doit comporter au moins 2 caractères." }, { status: 400 });
    }
    if (trimmed.length > 75) {
      return NextResponse.json({ error: "Le nom ne peut pas dépasser 75 caractères." }, { status: 400 });
    }
    updateData.name = trimmed;
  }

  // Validation de la description
  if (description !== undefined) {
    if (description && description.length > 1000) {
      return NextResponse.json({ error: "La description ne peut pas dépasser 1000 caractères." }, { status: 400 });
    }
    updateData.description = description?.trim();
  }

  // Validation de la catégorie
  if (category !== undefined) {
    const allowedCategories = [
      "Entreprise", "Média / Actualité", "Artiste / Groupe", "Association",
      "Éducation", "Santé", "Commerce", "Marque", "Personnage public", "Autre"
    ];
    if (category && !allowedCategories.includes(category)) {
      return NextResponse.json({ error: "Catégorie non reconnue." }, { status: 400 });
    }
    updateData.category = category;
  }

  // Validation des URLs
  if (website !== undefined) {
    if (website && !isValidUrl(website)) {
      return NextResponse.json({ error: "L'URL du site web est invalide." }, { status: 400 });
    }
    updateData.website = website?.trim();
  }
  if (imageUrl !== undefined) {
    if (imageUrl && !isValidUrl(imageUrl)) {
      return NextResponse.json({ error: "L'URL de l'image est invalide." }, { status: 400 });
    }
    updateData.imageUrl = imageUrl;
  }
  if (coverImage !== undefined) {
    if (coverImage && !isValidUrl(coverImage)) {
      return NextResponse.json({ error: "L'URL de la bannière est invalide." }, { status: 400 });
    }
    updateData.coverImage = coverImage;
  }

  // Validation de la localisation
  if (location !== undefined) {
    if (location && location.length > 150) {
      return NextResponse.json({ error: "La localisation est trop longue." }, { status: 400 });
    }
    updateData.location = location?.trim();
  }

  // Validation WhatsApp
  if (whatsappNumber !== undefined) {
    const cleaned = whatsappNumber?.replace(/\D/g, '') || "";
    if (whatsappNumber && (cleaned.length < 7 || cleaned.length > 15)) {
      return NextResponse.json({ error: "Le numéro WhatsApp n'est pas valide." }, { status: 400 });
    }
    updateData.whatsappNumber = whatsappNumber?.trim();
  }

  // Si aucune donnée valide à mettre à jour
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour." }, { status: 400 });
  }

  // Mettre à jour
  const updated = await prisma.page.update({
    where: { id: pageId },
    data: updateData,
  });

  return NextResponse.json(updated);
}