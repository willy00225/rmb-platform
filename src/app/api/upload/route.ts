import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    // Convertir le fichier en base64 pour Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Uploader sur Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "rmb-platform",
      resource_type: "auto",
    });

    const url = result.secure_url;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erreur upload Cloudinary :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}