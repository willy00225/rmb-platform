export function resetPasswordEmail(
  resetLink: string,
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
  <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin:0; padding:0; background-color:#F9FAFB; font-family: 'Inter', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <!-- Logo -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align:center;">
              <img src="${logoUrl}" alt="RMB Connect" style="height:40px; width:auto; display:block; margin:0 auto;" />
            </td>
          </tr>
          <!-- Titre -->
          <tr>
            <td style="padding: 16px 32px 8px 32px; text-align:center;">
              <h1 style="font-size:22px; font-weight:700; color:${primaryColor}; margin:0;">Réinitialisation du mot de passe</h1>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td style="padding: 8px 32px 24px 32px; text-align:center; color:#4B5563; font-size:15px; line-height:1.5;">
              <p style="margin:0 0 16px 0;">Vous avez demandé la réinitialisation de votre mot de passe pour votre compte RMB Connect.</p>
              <p style="margin:0 0 24px 0;">Cliquez sur le bouton ci‑dessous pour créer un nouveau mot de passe (lien valable <strong>1 heure</strong>).</p>
              <!-- Bouton -->
              <a href="${resetLink}" style="display:inline-block; background-color:${primaryColor}; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:999px; font-weight:600; font-size:16px;">Réinitialiser mon mot de passe</a>
            </td>
          </tr>
          <!-- Séparateur -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #E5E7EB; margin:0;" />
            </td>
          </tr>
          <!-- Note de sécurité -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; text-align:center; color:#9CA3AF; font-size:12px;">
              <p style="margin:0;">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
            </td>
          </tr>
          <!-- Pied de page -->
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
