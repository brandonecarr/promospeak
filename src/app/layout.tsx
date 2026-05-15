import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: brand.name,
    template: site.defaultMeta.titleTemplate,
  },
  description: site.defaultMeta.description,
  keywords: [...site.defaultMeta.keywords],
  authors: [{ name: brand.legalName }],
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: brand.name,
    description: site.defaultMeta.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: site.defaultMeta.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
