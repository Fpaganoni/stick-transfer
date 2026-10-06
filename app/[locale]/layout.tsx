import type React from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MotionConfig } from "framer-motion";
import "../globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryProvider } from "@/lib/query-client";
import { AuthInitializer } from "@/components/auth/auth-initializer";
import { Toaster } from "@/components/ui/sonner";
import { locales } from "@/i18n/request";

const title = "Stick Transfer - Hockey Job Board";
const description =
  "Connecting hockey talent with opportunities. Find jobs, trials, and clubs worldwide.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sticktransfer.com",
  ),
  title,
  description,
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "Stick Transfer",
    title,
    description,
    images: [
      { url: "/og-16x9.jpg", width: 1200, height: 675, alt: title },
      { url: "/og-21x9.jpg", width: 1680, height: 720, alt: title },
      { url: "/og-1x1.jpg", width: 600, height: 600, alt: title },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-16x9.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#18283E",
  userScalable: false,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params for Next.js 15+
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head></head>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthInitializer />
            <MotionConfig reducedMotion="user">
              <ThemeProvider>{children}</ThemeProvider>
            </MotionConfig>
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
