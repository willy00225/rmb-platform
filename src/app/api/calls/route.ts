import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { receiverId, status } = await req.json();
  const call = await prisma.call.create({
    data: {
      callerId: session.user.id,
      receiverId,
      status,
    },
  });
  return NextResponse.json(call, { status: 201 });
}
