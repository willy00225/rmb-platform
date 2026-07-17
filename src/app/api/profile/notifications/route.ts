import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Clés autorisées pour les préférences de notification
const ALLOWED_KEYS = [
  "push_enabled",
  "email_enabled",
  "sms_enabled",
  "new_message",
  "new_follower",
  "new_comment",
  "post_liked",
  "page_followed",
  "challenge_reminder",
  "event_reminder",
  "marketing",
];

function sanitizePreferences(obj: any): Record<string, boolean> {
  const sanitized: Record<string, boolean> = {};
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return {};
  }
  for (const [key, value] of Object.entries(obj)) {
    if (ALLOWED_KEYS.includes(key) && typeof value === "boolean") {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const preferences = user?.notificationPreferences || {};
  return NextResponse.json(preferences);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérification KYC et restrictions (optionnelle mais cohérente avec le reste)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true, restrictedUntil: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (user.restrictedUntil && new Date() < user.restrictedUntil) {
    return NextResponse.json({ error: "Vous êtes temporairement restreint." }, { status: 403 });
  }
  if (user.role === "SUSPENDED") {
    return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });
  }

  // Parser le corps de la requête
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  // Nettoyer et ne garder que les clés autorisées
  const sanitized = sanitizePreferences(body);

  // Limiter la taille (éviter un JSON monstrueux)
  if (JSON.stringify(sanitized).length > 2000) {
    return NextResponse.json({ error: "Préférences trop volumineuses." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: sanitized },
  });

  return NextResponse.json({ success: true, preferences: sanitized });
}