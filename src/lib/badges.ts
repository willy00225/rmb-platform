import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { badges: true, donations: true, posts: true, participations: true, comments: true },
  });
  if (!user) return;

  const badges = await prisma.badge.findMany();
  for (const badge of badges) {
    const alreadyHas = user.badges.some(b => b.badgeId === badge.id);
    if (alreadyHas) continue;

    let conditionMet = false;
    switch (badge.condition) {
      case "first_donation": if (user.donations.length >= 1) conditionMet = true; break;
      case "five_posts": if (user.posts.length >= 5) conditionMet = true; break;
      case "first_event": if (user.participations.length >= 1) conditionMet = true; break;
      case "level_5": if (user.level >= 5) conditionMet = true; break;
      case "ten_comments": if (user.comments.length >= 10) conditionMet = true; break;
    }

    if (conditionMet) {
      await prisma.userBadge.create({
        data: { userId: user.id, badgeId: badge.id },
      });
      // Notification push "Badge débloqué !"
      await sendPushNotification({
        headings: { fr: "Nouveau badge ! 🏆" },
        contents: { fr: `Vous avez débloqué le badge "${badge.name}"` },
        includeExternalUserIds: [userId],
      });
    }
  }
}
