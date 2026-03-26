import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Fridgo — Virtuální lednice",
    template: "%s | Fridgo",
  },
  description:
    "Spravujte svou lednici, spíž a mrazák. Nechte AI navrhovat recepty z dostupných ingrediencí.",
  keywords: ["lednice", "spíž", "mrazák", "recepty", "ingredience", "nákupní seznam"],
  authors: [{ name: "Fridgo" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
