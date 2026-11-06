import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DeferredChrome } from "@/components/layout/deferred-chrome";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { COMPANY_SLOGAN } from "@/lib/company";
import { PWA_THEME_COLOR } from "@/lib/pwa/manifest";
import { siteOrigin } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${APP_NAME} — ${COMPANY_SLOGAN}`,
    template: `%s · ${APP_NAME}`,
  },
  description: `${COMPANY_SLOGAN}. ${APP_TAGLINE}`,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/pwa/site/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenu-principal"
          className="absolute left-4 top-4 z-[100] -translate-y-[220%] rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground opacity-0 transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-highlight"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <div id="contenu-principal" className="flex flex-1 flex-col pt-[4.25rem]">
          {children}
        </div>
        <SiteFooter />
        <DeferredChrome />
        <PwaRegister scope="/" />
      </body>
    </html>
  );
}
