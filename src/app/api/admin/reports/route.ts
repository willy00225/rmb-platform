import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: { select: { firstName: true, lastName: true } },
      post: { select: { content: true } },
      comment: { select: { content: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reports);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { reportId, status } = await req.json();
  await prisma.report.update({ where: { id: reportId }, data: { status } });

  // Journal d'audit
  await createAuditLog({
    action: status === "RESOLVED" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
    entityType: "Report",
    entityId: reportId,
    adminId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
