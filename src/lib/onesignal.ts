export async function sendPushNotification({
  headings,
  contents,
  includedSegments = ["Subscribed Users"],
  includeExternalUserIds,
}: {
  headings: { en?: string; fr?: string };
  contents: { en?: string; fr?: string };
  includedSegments?: string[];
  includeExternalUserIds?: string[];
}) {
  const payload: Record<string, unknown> = {
    app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    headings,
    contents,
  };

  if (includeExternalUserIds && includeExternalUserIds.length > 0) {
    payload.include_external_user_ids = includeExternalUserIds;
  } else {
    payload.included_segments = includedSegments;
  }

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}
