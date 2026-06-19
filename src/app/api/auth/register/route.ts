import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      phone,
      fonction,
      city,
      village,
      canton,
      currentCity,
      currentVillage,
      currentCountry,
    } = await req.json();

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    // Vérifier si le téléphone existe déjà (s'il est fourni)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ error: "Ce numéro de téléphone est déjà utilisé." }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone: phone || null,
        fonction: fonction || null,
        city: city || null,
        village: village || null,
        canton: canton || null,
        currentCity: currentCity || null,
        currentVillage: currentVillage || null,
        currentCountry: currentCountry || null,
      },
    });

    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}