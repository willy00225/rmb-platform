import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { firstName, lastName, city, village, canton, avatar } = await req.json();

  const updateData: any = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (city !== undefined) updateData.city = city;
  if (village !== undefined) updateData.village = village;
  if (canton !== undefined) updateData.canton = canton;
  if (avatar !== undefined) updateData.avatar = avatar;

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}