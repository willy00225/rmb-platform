export function contactNotificationEmail(
  senderName: string,
  senderEmail: string,
  message: string,
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
  <title>Nouveau message de contact</title>
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
              <h1 style="font-size:22px; font-weight:700; color:${primaryColor}; margin:0;">📩 Nouveau message de contact</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 24px 32px; color:#4B5563; font-size:15px; line-height:1.5;">
              <p style="margin:0 0 8px 0;"><strong>De :</strong> ${senderName} (${senderEmail})</p>
              <p style="margin:0 0 16px 0;"><strong>Message :</strong></p>
              <p style="margin:0; background-color:#F3F4F6; padding:12px; border-radius:8px; white-space:pre-wrap;">${message}</p>
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