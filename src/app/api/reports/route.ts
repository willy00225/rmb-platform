import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { postId, commentId, reason } = await req.json();
  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      postId: postId || null,
      commentId: commentId || null,
      reason,
    },
  });
  return NextResponse.json({ success: true }, { status: 201 });
}