import type React from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryProvider } from "@/lib/query-client";
import { AuthInitializer } from "@/components/auth/auth-initializer";
import { Toaster } from "@/components/ui/sonner";
import { locales } from "@/i18n/request";

export const metadata: Metadata = {
  title: "Stick Transfer - Hockey Job Board",
  description:
    "Connecting hockey talent with opportunities. Find jobs, trials, and clubs worldwide.",
  generator: "v0.app",
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
  if (!locales.includes(locale as any)) {
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
            <ThemeProvider>{children}</ThemeProvider>
            <Toaster />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
