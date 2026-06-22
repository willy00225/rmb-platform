export function kycRejectedEmail(
  firstName: string,
  reason: string,
  logoUrl: string,
  primaryColor = "#005A3A",
  secondaryColor = "#C99619"
) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérification d'identité rejetée</title>
</head>
<body style="margin:0; padding:0; background-color:#F9FAFB; font-family: 'Inter', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align:center;">
              <img src="${logoUrl}" alt="RMB Connect" style="height:40px; width:auto; display:block; margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 8px 32px; text-align:center;">
              <h1 style="font-size:22px; font-weight:700; color:#DC2626; margin:0;">❌ Vérification rejetée</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 24px 32px; text-align:center; color:#4B5563; font-size:15px; line-height:1.5;">
              <p style="margin:0 0 16px 0;">Bonjour ${firstName},</p>
              <p style="margin:0 0 16px 0;">Votre demande de vérification d'identité a été <strong>rejetée</strong> pour la raison suivante :</p>
              <p style="margin:0 0 16px 0; background-color:#FEE2E2; padding:12px; border-radius:8px; color:#B91C1C;">${reason || "Les documents fournis ne sont pas conformes."}</p>
              <p style="margin:0 0 16px 0;">Vous pouvez soumettre de nouveaux documents depuis votre espace KYC.</p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/kyc" style="display:inline-block; background-color:${primaryColor}; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:999px; font-weight:600; font-size:16px;">Soumettre à nouveau</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color:${primaryColor}; text-align:center;">
              <p style="margin:0; color:#FFFFFF; font-size:12px;">© ${new Date().getFullYear()} RMB Connect – Réseau Mondial des Bétés</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}