import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ['italic', 'normal'],
  variable: "--font-newsreader"
});

export const metadata: Metadata = {
  title: "CORE - The Essence of Investment",
  description: "The Essence of Investment. Market Noise Rejected.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable,
        newsreader.variable
      )}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
