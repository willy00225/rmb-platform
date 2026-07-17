import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { sendEmail } from "@/lib/email";

type NotificationPreferences = Record<string, boolean>;

/**
 * Envoie une notification à un utilisateur en respectant ses préférences.
 * @param userId - ID de l'utilisateur
 * @param eventKey - Clé de l'événement (ex: "new_comment", "post_liked", etc.)
 * @param pushTitle - Titre de la notification push
 * @param pushBody - Contenu de la notification push
 * @param emailSubject - Sujet de l'email (optionnel)
 * @param emailHtml - Contenu HTML de l'email (optionnel)
 */
export async function notifyUser(
  userId: string,
  eventKey: string,
  pushTitle: string,
  pushBody: string,
  emailSubject?: string,
  emailHtml?: string
): Promise<void> {
  try {
    // 1. Récupérer les préférences et l'email de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPreferences: true,
        email: true,
      },
    });

    if (!user) {
      console.warn(`notifyUser : utilisateur ${userId} introuvable.`);
      return;
    }

    // 2. Extraire les préférences pour cet événement
    const prefs = (user.notificationPreferences as NotificationPreferences) || {};
    const pushEnabled = prefs.push_enabled !== false && prefs[eventKey] !== false;
    const emailEnabled = prefs.email_enabled === true && prefs[eventKey] === true;

    // 3. Notification push (si activée)
    if (pushEnabled) {
      try {
        await sendPushNotification({
          headings: { fr: pushTitle },
          contents: { fr: pushBody },
          includeExternalUserIds: [userId],
        });
      } catch (pushError) {
        console.error(`Erreur push pour ${userId} (${eventKey}) :`, pushError);
      }
    }

    // 4. Notification email (si activée et email disponible)
    if (emailEnabled && user.email && emailSubject && emailHtml) {
      try {
        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error(`Erreur email pour ${user.email} (${eventKey}) :`, emailError);
      }
    }

    // 5. Notification in-app (toujours sauvegardée si la clé n'est pas explicitement désactivée)
    const inAppEnabled = prefs[eventKey] !== false;
    if (inAppEnabled) {
      await prisma.notification.create({
        data: {
          userId,
          type: eventKey,
          title: pushTitle,
          body: pushBody,
        },
      });
    }
  } catch (error) {
    console.error(`Erreur dans notifyUser (${eventKey} pour ${userId}) :`, error);
  }
}