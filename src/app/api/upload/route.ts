import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// POST : uploader un fichier
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

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Retourne l'URL de service (query string)
    const url = `/api/uploads?file=${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erreur upload :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET : servir un fichier uploadé
export async function GET(req: Request) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");
  if (!file) return new NextResponse(null, { status: 400 });

  const fullPath = path.join(process.cwd(), "public", "uploads", file);

  if (!existsSync(fullPath)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}