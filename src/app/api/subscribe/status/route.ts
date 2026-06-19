import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ active: false });

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const active = sub ? new Date(sub.expiresAt) > new Date() : false;
  return NextResponse.json({ active });
}