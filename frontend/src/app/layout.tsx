import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/providers/SearchProvider";

import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

const inter = Inter({
  variable: "--font-inter",
  subsets: ['latin'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: "Hypertube",
  description: "Movie Streaming Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const locale = await getLocale();
  const messages = await getMessages();

  // provider must be root level to preserve state between pages
  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <SearchProvider>
            {children}
          </SearchProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
