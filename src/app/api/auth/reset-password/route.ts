import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gte: new Date() } },
  });
  if (!user) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, resetToken: null, resetTokenExpires: null },
  });

  return NextResponse.json({ message: "Mot de passe modifié." });
}