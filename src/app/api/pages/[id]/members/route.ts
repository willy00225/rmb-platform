import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageRole } from "@prisma/client";

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// GET : lister les membres
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pageId } = await params;

  if (!isValidUUID(pageId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const members = await prisma.pageMember.findMany({
    where: { pageId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { joinedAt: "asc" },
    take: 50, // Limiter la liste
  });

  return NextResponse.json(members);
}

// POST : ajouter, modifier ou supprimer un membre (action réservée à l'admin)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: pageId } = await params;

  if (!isValidUUID(pageId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { action, userId, role } = body;

  if (!action || !userId) {
    return NextResponse.json({ error: "action et userId sont requis" }, { status: 400 });
  }

  if (!isValidUUID(userId)) {
    return NextResponse.json({ error: "Utilisateur invalide" }, { status: 400 });
  }

  // Vérifier que la page existe et n'est pas suspendue
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { suspended: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
  }
  if (page.suspended) {
    return NextResponse.json({ error: "Cette page est suspendue." }, { status: 403 });
  }

  // Vérifier que l'utilisateur connecté est ADMIN de la page
  const membership = await prisma.pageMember.findUnique({
    where: { userId_pageId: { userId: session.user.id, pageId } },
  });

  if (!membership || membership.role !== PageRole.ADMIN) {
    return NextResponse.json(
      { error: "Action réservée aux administrateurs de la page" },
      { status: 403 }
    );
  }

  // Limites de membres
  const memberCount = await prisma.pageMember.count({ where: { pageId } });

  try {
    switch (action) {
      case "add": {
        // Empêcher d'ajouter un membre déjà présent
        const exists = await prisma.pageMember.findUnique({
          where: { userId_pageId: { userId, pageId } },
        });
        if (exists) {
          return NextResponse.json({ error: "Cet utilisateur est déjà membre." }, { status: 409 });
        }

        if (memberCount >= 20) {
          return NextResponse.json({ error: "Limite de 20 membres atteinte." }, { status: 403 });
        }

        const validRoles = [PageRole.ADMIN, PageRole.EDITOR, PageRole.MODERATOR];
        const assignedRole = validRoles.includes(role as PageRole) ? (role as PageRole) : PageRole.MODERATOR;

        const newMember = await prisma.pageMember.create({
          data: {
            userId,
            pageId,
            role: assignedRole,
          },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        });
        return NextResponse.json(newMember, { status: 201 });
      }

      case "update": {
        if (!role) {
          return NextResponse.json({ error: "Le rôle est requis pour la mise à jour" }, { status: 400 });
        }
        const validRoles = [PageRole.ADMIN, PageRole.EDITOR, PageRole.MODERATOR];
        if (!validRoles.includes(role as PageRole)) {
          return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
        }
        const updated = await prisma.pageMember.update({
          where: { userId_pageId: { userId, pageId } },
          data: { role: role as PageRole },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        });
        return NextResponse.json(updated);
      }

      case "remove": {
        // Empêcher de retirer le dernier administrateur
        const targetMember = await prisma.pageMember.findUnique({
          where: { userId_pageId: { userId, pageId } },
        });
        if (!targetMember) {
          return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
        }
        if (targetMember.role === PageRole.ADMIN && memberCount <= 1) {
          return NextResponse.json({ error: "Impossible de retirer le seul administrateur." }, { status: 403 });
        }
        await prisma.pageMember.delete({
          where: { userId_pageId: { userId, pageId } },
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Action invalide. Utilisez add, update ou remove." }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur gestion membres page :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}