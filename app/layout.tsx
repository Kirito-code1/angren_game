import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Angren Game | Регулярные турниры по PUBG MOBILE и MLBB",
  description:
    "Турниры по мобильному киберспорту: расписание, регистрация команд, сетка матчей и результаты.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="ru">
      <body className="min-h-screen bg-app antialiased">
        <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
          <div className="background-grid" aria-hidden />
          <div className="background-orb background-orb-left" aria-hidden />
          <div className="background-orb background-orb-right" aria-hidden />
          <div className="background-orb background-orb-bottom" aria-hidden />
          <SiteHeader currentUser={currentUser} />
          <main className="page-shell mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
