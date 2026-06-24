import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, kycLevel, twoFactorEnabled } = body;

  const updateData: any = {};
  if (role !== undefined) updateData.role = role;
  if (kycLevel !== undefined) updateData.kycLevel = kycLevel;
  if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;

  // Un admin ne peut pas modifier un super admin
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  // Enregistrer l'audit
  const changes = [];
  if (role !== undefined) changes.push(`Rôle -> ${role}`);
  if (kycLevel !== undefined) changes.push(`KYC -> ${kycLevel}`);
  if (twoFactorEnabled !== undefined) changes.push(`2FA -> ${twoFactorEnabled}`);

  await createAuditLog({
    action: "USER_UPDATED",
    entityType: "User",
    entityId: id,
    adminId: session.user.id,
    details: JSON.stringify({ changes }),
  });

  return NextResponse.json({ success: true });
}