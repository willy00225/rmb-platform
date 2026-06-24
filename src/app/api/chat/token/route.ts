import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { StreamChat } from "stream-chat";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const token = serverClient.createToken(session.user.id);
  return NextResponse.json({ token });
}
