import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { 
    firstName, 
    lastName, 
    city, 
    village, 
    canton, 
    avatar, 
    coverImage, 
    currentPassword, 
    newPassword 
  } = await req.json();

  const updateData: Record<string, unknown> = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (city !== undefined) updateData.city = city;
  if (village !== undefined) updateData.village = village;
  if (canton !== undefined) updateData.canton = canton;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (coverImage !== undefined) updateData.coverImage = coverImage;

  // Gestion du changement de mot de passe
  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Utilisateur introuvable ou mot de passe non défini" }, { status: 404 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
