import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/onesignal";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, message, segment } = await req.json();
  // segment = "all" ou "AMBASSADOR", etc.
  await sendPushNotification({
    headings: { fr: title },
    contents: { fr: message },
    includedSegments: segment === "all" ? ["Subscribed Users"] : [segment],
  });

  // Journal d'audit
  await createAuditLog({
    action: "CAMPAIGN_SENT",
    entityType: "Notification",
    entityId: "broadcast",
    adminId: session.user.id,
    details: JSON.stringify({ title, segment }),
  });

  return NextResponse.json({ success: true });
}