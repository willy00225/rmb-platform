// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { contactNotificationEmail } from "@/emails/contactNotification";

export async function POST(req: Request) {
  const { name, email, message } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }

  // Récupérer l'email de l'administrateur depuis la config du site
  const siteConfigs = await prisma.siteConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const cfg of siteConfigs) configMap[cfg.key] = cfg.value;
  const adminEmail = configMap["contact_email"] || "contact@rmb-asso.org";
  const logoUrl = configMap["site_logo"] || "https://rmb-asso.org/images/logo-rmb.png";
  const primaryColor = configMap["site_primary_color"] || "#005A3A";
  const secondaryColor = configMap["site_secondary_color"] || "#C99619";

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Nouveau message de ${name} via le formulaire de contact`,
      html: contactNotificationEmail(name, email, message, logoUrl, primaryColor, secondaryColor),
    });
  } catch (err) {
    console.error("Erreur envoi email contact :", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
