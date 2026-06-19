// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "RMB Connect",
  description: "Réseau Mondial des Bétés – Plateforme communautaire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${lexend.variable}`} suppressHydrationWarning>
      <head>
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(function(OneSignal) {
                OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
                  notifyButton: { enable: false },
                  allowLocalhostAsSecureOrigin: true,
                  serviceWorkerParam: { scope: "/" },
                  path: "/OneSignalSDKWorker.js",
                });
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-bkg text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}