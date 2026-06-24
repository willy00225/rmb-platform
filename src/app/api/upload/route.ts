import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const uploadDir = path.join(process.cwd(), "public/uploads");

  if (file.type.startsWith("image/")) {
    const resizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(resizedBuffer));
  } else {
    await writeFile(path.join(uploadDir, filename), Buffer.from(buffer));
  }

  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}
