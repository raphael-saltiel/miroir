import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Miroir", other: { google: "notranslate" } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" translate="no">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
