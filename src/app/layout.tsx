import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreLayout } from "@/components/layout/store-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mily's | Tu Estilo, Tu Tienda",
  description: "Descubre las últimas tendencias en moda y tecnología con Mily's",
};

import { AIAssistant } from "@/components/ai/ai-assistant";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <StoreLayout>
          {children}
        </StoreLayout>
        <AIAssistant />
      </body>
    </html>
  );
}
