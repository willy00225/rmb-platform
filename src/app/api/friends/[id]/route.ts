import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: friendshipId } = await params;

  // ✅ Vérification KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour gérer vos invitations.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const { action } = await req.json(); // "accept" | "reject" | "block"

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });
  if (!friendship || friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let newStatus = friendship.status;
  if (action === "accept") newStatus = "ACCEPTED";
  else if (action === "reject") newStatus = "PENDING"; // on supprimera ci-dessous
  else if (action === "block") newStatus = "BLOCKED";

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: newStatus },
  });

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
  }

  return NextResponse.json({ success: true });
}