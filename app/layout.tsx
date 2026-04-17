import type { Metadata } from "next";
import {
  Bad_Script,
  Barlow_Condensed,
  Inter,
  Manrope,
  Permanent_Marker,
  Roboto_Condensed,
} from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getUiPreferences } from "@/lib/preferences";
import "./globals.css";
import "./clutch-mockup.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body-family",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-heading-family-latin",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-heading-family-cyrillic",
});

const clutchBrushLatin = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-clutch-brush-latin",
});

const clutchBrushCyrillic = Bad_Script({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-clutch-brush-cyrillic",
});

export const metadata: Metadata = {
  title: "Angren Game",
  description:
    "Турниры по мобильному киберспорту: расписание, регистрация команд, сетка матчей и результаты.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const { locale, theme } = await getUiPreferences();

  return (
    <html
      lang={locale}
      data-theme={theme}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${barlowCondensed.variable} ${robotoCondensed.variable} ${clutchBrushLatin.variable} ${clutchBrushCyrillic.variable}`}
    >
      <body className="site-body antialiased">
        <div className="site-root">
          <SiteHeader currentUser={currentUser} locale={locale} theme={theme} />
          <main className="site-main">{children}</main>
          <SiteFooter locale={locale} />
        </div>
      </body>
    </html>
  );
}
