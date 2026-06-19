import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { action } = await req.json(); // "accept" | "reject" | "block"

  const friendship = await prisma.friendship.findUnique({
    where: { id: params.id },
  });
  if (!friendship || friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let newStatus = friendship.status;
  if (action === "accept") newStatus = "ACCEPTED";
  else if (action === "reject") newStatus = "PENDING"; // en fait on supprime, donc on va faire un delete plutôt, mais on peut mettre un statut REJECTED
  else if (action === "block") newStatus = "BLOCKED";

  await prisma.friendship.update({
    where: { id: params.id },
    data: { status: newStatus },
  });

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: params.id } });
  }

  return NextResponse.json({ success: true });
}