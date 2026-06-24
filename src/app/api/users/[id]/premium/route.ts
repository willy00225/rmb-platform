import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sub = await prisma.subscription.findUnique({
    where: { userId: id },
  });
  const isPremium = sub ? new Date(sub.expiresAt) > new Date() : false;
  return NextResponse.json({ isPremium });
}