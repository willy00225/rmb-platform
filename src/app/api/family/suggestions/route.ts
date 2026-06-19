import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Trouver des personnes qui partagent des relations communes avec l'utilisateur
  // Exemple : si l'utilisateur a un parent X, et que X a d'autres enfants (qui ne sont pas encore en relation avec l'utilisateur)
  const userRelations = await prisma.familyRelation.findMany({
    where: { OR: [{ fromUserId: session.user.id }, { toUserId: session.user.id }] },
  });

  const relatedUserIds = new Set<string>();
  for (const rel of userRelations) {
    relatedUserIds.add(rel.fromUserId);
    relatedUserIds.add(rel.toUserId);
  }
  relatedUserIds.delete(session.user.id);

  // Pour chaque personne liée, chercher leurs autres relations qui ne sont pas encore liées à l'utilisateur
  const suggestions: { id: string; firstName: string; lastName: string; avatar: string | null; reason: string }[] = [];

  for (const id of relatedUserIds) {
    const theirRelations = await prisma.familyRelation.findMany({
      where: { OR: [{ fromUserId: id }, { toUserId: id }] },
    });
    for (const rel of theirRelations) {
      const otherId = rel.fromUserId === id ? rel.toUserId : rel.fromUserId;
      if (otherId === session.user.id || relatedUserIds.has(otherId)) continue;
      // Vérifier si pas déjà lié à l'utilisateur
      const alreadyLinked = await prisma.familyRelation.findFirst({
        where: {
          OR: [
            { fromUserId: session.user.id, toUserId: otherId },
            { fromUserId: otherId, toUserId: session.user.id },
          ],
        },
      });
      if (!alreadyLinked) {
        const otherUser = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, firstName: true, lastName: true, avatar: true } });
        if (otherUser && !suggestions.find(s => s.id === otherUser.id)) {
          suggestions.push({
            ...otherUser,
            reason: `Connaît ${rel.relation} commun`,
          });
        }
      }
    }
  }

  return NextResponse.json(suggestions.slice(0, 10));
}