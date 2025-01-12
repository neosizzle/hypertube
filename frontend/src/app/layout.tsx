import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/providers/SearchProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ['latin'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: "Hypertube",
  description: "Movie Streaming Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // provider must be root level to preserve state between pages
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  );
}
