// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { OneSignalInit } from "@/components/notifications/OneSignalInit";

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
        {/* PWA */}
        <meta name="application-name" content="RMB Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RMB Connect" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#005A3A" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased bg-bkg text-text overflow-x-hidden">
        <Providers>{children}</Providers>
        <OneSignalInit />
      </body>
    </html>
  );
}
