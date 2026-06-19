import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  action,
  entityType,
  entityId,
  adminId,
  details,
}: {
  action: string;
  entityType: string;
  entityId: string;
  adminId: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      adminId,
      details,
    },
  });
}