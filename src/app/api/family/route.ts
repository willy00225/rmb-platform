import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET : arbre complet de l'utilisateur (ou d'un autre membre si ?userId=)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId") || session.user.id;

  // Récupérer toutes les relations où l'utilisateur est impliqué
  const relations = await prisma.familyRelation.findMany({
    where: {
      OR: [{ fromUserId: targetUserId }, { toUserId: targetUserId }],
    },
    include: {
      fromUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      toUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  // Construire l'arbre
  const parents: any[] = [];
  const children: any[] = [];
  const spouses: any[] = [];
  const siblings: any[] = [];

  for (const rel of relations) {
    if (rel.relation === "parent") {
      if (rel.fromUserId === targetUserId) {
        parents.push(rel.toUser);
      } else {
        parents.push(rel.fromUser);
      }
    } else if (rel.relation === "child") {
      if (rel.fromUserId === targetUserId) {
        children.push(rel.toUser);
      } else {
        children.push(rel.fromUser);
      }
    } else if (rel.relation === "spouse") {
      const spouse = rel.fromUserId === targetUserId ? rel.toUser : rel.fromUser;
      spouses.push(spouse);
    } else if (rel.relation === "sibling") {
      const sibling = rel.fromUserId === targetUserId ? rel.toUser : rel.fromUser;
      siblings.push(sibling);
    }
  }

  // Dédupliquer
  const uniqueParents = parents.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
  const uniqueChildren = children.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const uniqueSpouses = spouses.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
  const uniqueSiblings = siblings.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

  return NextResponse.json({
    parents: uniqueParents,
    children: uniqueChildren,
    spouses: uniqueSpouses,
    siblings: uniqueSiblings,
  });
}

// POST : ajouter une relation (réciproque automatique)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour ajouter une relation familiale.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { toUserId, relation } = await req.json();
  if (!toUserId || !relation) return NextResponse.json({ error: "Destinataire et relation requis" }, { status: 400 });
  if (toUserId === session.user.id) return NextResponse.json({ error: "Vous ne pouvez pas vous lier à vous-même" }, { status: 400 });

  // Vérifier si la relation existe déjà
  const existing = await prisma.familyRelation.findFirst({
    where: {
      OR: [
        { fromUserId: session.user.id, toUserId, relation },
        { fromUserId: toUserId, toUserId: session.user.id, relation },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Cette relation existe déjà" }, { status: 400 });

  // Créer la relation principale
  const familyRelation = await prisma.familyRelation.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      relation,
    },
    include: {
      toUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  // Créer la relation réciproque automatiquement
  let reciprocalRelation = "";
  if (relation === "parent") reciprocalRelation = "child";
  else if (relation === "child") reciprocalRelation = "parent";
  else if (relation === "spouse") reciprocalRelation = "spouse";
  else if (relation === "sibling") reciprocalRelation = "sibling";

  if (reciprocalRelation) {
    const existingReciprocal = await prisma.familyRelation.findFirst({
      where: {
        OR: [
          { fromUserId: toUserId, toUserId: session.user.id, relation: reciprocalRelation },
          { fromUserId: session.user.id, toUserId, relation: reciprocalRelation },
        ],
      },
    });
    if (!existingReciprocal) {
      await prisma.familyRelation.create({
        data: {
          fromUserId: toUserId,
          toUserId: session.user.id,
          relation: reciprocalRelation,
        },
      });
    }
  }

  return NextResponse.json(familyRelation, { status: 201 });
}

// DELETE : supprimer une relation (et sa réciproque)
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour modifier vos relations familiales.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { relationId } = await req.json();
  const rel = await prisma.familyRelation.findUnique({ where: { id: relationId } });
  if (!rel || (rel.fromUserId !== session.user.id && rel.toUserId !== session.user.id)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Déterminer la relation réciproque
  let reciprocalRelation = "";
  if (rel.relation === "parent") reciprocalRelation = "child";
  else if (rel.relation === "child") reciprocalRelation = "parent";
  else if (rel.relation === "spouse") reciprocalRelation = "spouse";
  else if (rel.relation === "sibling") reciprocalRelation = "sibling";

  // Supprimer la relation réciproque si elle existe
  if (reciprocalRelation) {
    await prisma.familyRelation.deleteMany({
      where: {
        OR: [
          { fromUserId: rel.toUserId, toUserId: rel.fromUserId, relation: reciprocalRelation },
          { fromUserId: rel.fromUserId, toUserId: rel.toUserId, relation: reciprocalRelation },
        ],
      },
    });
  }

  // Supprimer la relation elle-même
  await prisma.familyRelation.delete({ where: { id: relationId } });

  return NextResponse.json({ success: true });
}