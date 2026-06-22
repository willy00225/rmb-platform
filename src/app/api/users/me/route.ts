import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true, role: true },
  });
  return NextResponse.json(user);
}