import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.radioConfig.findUnique({ where: { id: "main" } });
  const podcasts = await prisma.podcast.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ...config, podcasts });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // ✅ Vérification KYC de l'admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  if (!user || (user.kycLevel !== "ID_VERIFIED" && user.kycLevel !== "AMBASSADOR")) {
    return NextResponse.json(
      { error: "Votre identité doit être vérifiée pour gérer la radio.", code: "KYC_REQUIRED" },
      { status: 403 }
    );
  }

  const body = await req.json();
  await prisma.radioConfig.upsert({
    where: { id: "main" },
    create: { id: "main", ...body },
    update: body,
  });

  const config = await prisma.radioConfig.findUnique({ where: { id: "main" } });
  return NextResponse.json({ success: true, config });
}