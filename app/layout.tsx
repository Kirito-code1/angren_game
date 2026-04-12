import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Manrope, Permanent_Marker } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";
import "./clutch-mockup.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body-family",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-heading-family",
});

const clutchBrush = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-clutch-brush",
});

export const metadata: Metadata = {
  title: "ClutchZone | Mobile Esports Platform",
  description:
    "Compete in PUBG Mobile and Mobile Legends tournaments with leaderboards, profiles, brackets, and rewards.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html
      lang="ru"
      className={`${inter.variable} ${manrope.variable} ${barlowCondensed.variable} ${clutchBrush.variable}`}
    >
      <body className="site-body antialiased">
        <div className="site-root">
          <SiteHeader currentUser={currentUser} />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
