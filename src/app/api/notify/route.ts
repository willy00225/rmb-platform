import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/onesignal";

export async function POST(req: Request) {
  const { userId, title, message } = await req.json();
  if (!userId || !message) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  await sendPushNotification({
    headings: { fr: title },
    contents: { fr: message },
    includeExternalUserIds: [userId],
  });

  return NextResponse.json({ success: true });
}