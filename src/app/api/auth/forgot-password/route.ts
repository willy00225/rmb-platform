import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: "Si l'email existe, un lien a été envoyé." });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  // Ici, envoyez un email avec le lien (nodemailer ou autre)
  console.log(`Lien de réinitialisation : http://localhost:3001/auth/reset-password/${token}`);

  return NextResponse.json({ message: "Si l'email existe, un lien a été envoyé." });
}