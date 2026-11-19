import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { readLocale } from "@/lib/locale";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Menaxho",
    template: "%s · Menaxho",
  },
  description: "Shëno shpenzimet dhe shih sa të mbeten këtë muaj.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await readLocale();

  return (
    <html lang={locale} className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-ink">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          {locale === "en" ? "Skip to content" : "Kalo te përmbajtja"}
        </a>
        {children}
      </body>
    </html>
  );
}
