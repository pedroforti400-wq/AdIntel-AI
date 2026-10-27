import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { THEME_INIT_SCRIPT } from "@/components/layout/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AdIntel AI",
    template: "%s · AdIntel AI",
  },
  description: "Pesquisa de mercado e inteligência competitiva sobre anúncios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
