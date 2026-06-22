import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail } from "@/emails/resetPassword";

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  // Toujours répondre positivement pour ne pas divulguer d'information
  if (!user) {
    return NextResponse.json({ message: "Si l'email existe, un lien a été envoyé." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  // Récupérer l'URL du logo depuis la configuration du site
  const siteConfigs = await prisma.siteConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const cfg of siteConfigs) configMap[cfg.key] = cfg.value;
  const logoUrl = configMap["site_logo"] || "https://rmb-asso.org/images/logo-rmb.png";

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;

  try {
    await sendEmail({
      to: user.email!,
      subject: "Réinitialisation de votre mot de passe - RMB Connect",
      html: resetPasswordEmail(resetLink, logoUrl),
    });
  } catch (err) {
    console.error("Erreur envoi email forgot password :", err);
    // Ne pas bloquer l'utilisateur en cas d'échec de l'envoi
  }

  return NextResponse.json({ message: "Si l'email existe, un lien a été envoyé." });
}