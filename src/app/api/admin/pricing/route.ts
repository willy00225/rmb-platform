import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const [configs, features, subscribers] = await Promise.all([
    prisma.pricingConfig.findMany(),
    prisma.premiumFeature.findMany(),
    prisma.subscription.findMany({ include: { user: { select: { firstName: true, lastName: true, email: true } } } }),
  ]);

  return NextResponse.json({ configs, features, subscribers });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id, amount, active, label } = await req.json();
  await prisma.pricingConfig.update({
    where: { id },
    data: { amount, active, label },
  });

  return NextResponse.json({ success: true });
}
