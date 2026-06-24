import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { sendEmail } from "@/lib/email";
import { donationConfirmationEmail } from "@/emails/donationConfirmation";
import { orderConfirmationEmail } from "@/emails/orderConfirmation"; // ✅ ajout de l'import manquant
import { updateChallenges } from "@/lib/challenges";
import { checkAndAwardBadges } from "@/lib/badges";
import { addXp } from "@/lib/xp";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.status === "ACCEPTED") {
    let userId: string | null = null;
    let metadata: Record<string, any> = {};
    const amount = parseFloat(body.amount);

    try {
      metadata = JSON.parse(body.metadata);
      userId = metadata.userId ?? null;
    } catch {}

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non identifié" }, { status: 400 });
    }

    // ─── Configuration du site (logo, couleurs) ───
    const siteConfigs = await prisma.siteConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const cfg of siteConfigs) configMap[cfg.key] = cfg.value;
    const logoUrl = configMap["site_logo"] || "https://rmb-asso.org/images/logo-rmb.png";
    const primaryColor = configMap["site_primary_color"] || "#005A3A";
    const secondaryColor = configMap["site_secondary_color"] || "#C99619";

    // ─── 1. Dons ───
    if (metadata.type === "donation" || !metadata.type) {
      await prisma.donation.create({
        data: {
          userId,
          amount,
          paymentId: body.transaction_id,
          receiptUrl: "",
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { totalDonated: { increment: amount } },
      });

      await updateChallenges("donations");
      await checkAndAwardBadges(userId);
      await addXp(userId, 20);

      await sendPushNotification({
        headings: { fr: "Merci pour votre don ❤️" },
        contents: { fr: `Votre don de ${amount} XOF a bien été reçu.` },
        includeExternalUserIds: [userId],
      });

      const donor = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });
      if (donor?.email) {
        await sendEmail({
          to: donor.email,
          subject: "Confirmation de don – RMB Connect",
          html: donationConfirmationEmail(donor.firstName, amount, logoUrl, primaryColor, secondaryColor),
        }).catch(err => console.error("Erreur envoi email don :", err));
      }
    }

    // ─── 2. Abonnements ───
    if (metadata.type === "subscription") {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await prisma.subscription.upsert({
        where: { userId },
        create: { userId, expiresAt, autoRenew: true },
        update: { expiresAt, autoRenew: true },
      });

      await prisma.transaction.create({
        data: {
          userId,
          type: "subscription",
          amount,
          reference: body.transaction_id,
        },
      });

      await sendPushNotification({
        headings: { fr: "Abonnement premium activé 🚀" },
        contents: { fr: "Votre abonnement mensuel est maintenant actif. Profitez de tous les avantages !" },
        includeExternalUserIds: [userId],
      });
    }

    // ─── 3. Boosts ───
    if (metadata.type === "boost") {
      let boostCount = 0;
      switch (metadata.boostType) {
        case "single": boostCount = 1; break;
        case "pack5": boostCount = 5; break;
        case "pack10": boostCount = 10; break;
        default: boostCount = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { boosts: { increment: boostCount } },
      });

      await prisma.transaction.create({
        data: {
          userId,
          type: "boost",
          amount,
          reference: body.transaction_id,
          metadata: JSON.stringify({ boostType: metadata.boostType, boostCount }),
        },
      });

      await sendPushNotification({
        headings: { fr: "Boosts achetés ⚡" },
        contents: { fr: `Vous avez acheté ${boostCount} boost(s) avec succès.` },
        includeExternalUserIds: [userId],
      });
    }

    // ─── 4. Marketplace (avec commission automatique de 5%) ───
    if (metadata.type === "marketplace") {
      const productId = metadata.productId;
      const buyerId = userId;

      const product = await prisma.marketplaceProduct.findUnique({
        where: { id: productId },
        select: { userId: true, title: true },
      });
      if (!product) {
        return NextResponse.json({ error: "Produit introuvable" }, { status: 400 });
      }

      const sellerId = product.userId;

      const existingPurchase = await prisma.marketplacePurchase.findFirst({
        where: { productId },
      });

      if (!existingPurchase) {
        const commissionRate = 0.05;
        const commission = amount * commissionRate;
        const netAmount = amount - commission;

        await prisma.marketplacePurchase.create({
          data: {
            productId,
            buyerId,
            sellerId,
            amount,
            paymentId: body.transaction_id,
            commission,
          },
        });

        await prisma.user.update({
          where: { id: sellerId },
          data: { totalEarned: { increment: netAmount } },
        });

        await prisma.transaction.create({
          data: {
            userId: sellerId,
            type: "marketplace_sale",
            amount: netAmount,
            reference: body.transaction_id,
            metadata: JSON.stringify({
              productId,
              buyerId,
              commission,
              grossAmount: amount,
            }),
          },
        });

        await sendPushNotification({
          headings: { fr: "Votre article a été vendu 🎉" },
          contents: {
            fr: `L'article "${product.title}" a été acheté. Vous avez reçu ${netAmount} FCFA (commission de ${commission} FCFA).`,
          },
          includeExternalUserIds: [sellerId],
        });

        const buyer = await prisma.user.findUnique({
          where: { id: buyerId },
          select: { email: true, firstName: true },
        });
        if (buyer?.email) {
          await sendEmail({
            to: buyer.email,
            subject: "Confirmation de commande – RMB Connect",
            html: orderConfirmationEmail(buyer.firstName, product.title, amount, logoUrl, primaryColor, secondaryColor),
          }).catch(err => console.error("Erreur envoi email commande :", err));
        }

        await prisma.marketplaceProduct.update({
          where: { id: productId },
          data: { status: "sold" },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}