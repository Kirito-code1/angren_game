"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import {
  LOCALE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  supportedLocales,
  supportedThemes,
  type Locale,
  type Theme,
} from "@/lib/ui-preferences";
import type { User } from "@/lib/types";

type SiteHeaderProps = {
  currentUser: User | null;
  locale: Locale;
  theme: Theme;
};

export function SiteHeader({ currentUser, locale, theme }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const copy = getDictionary(locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [activeTheme, setActiveTheme] = useState<Theme>(theme);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme;
    localStorage.setItem(THEME_COOKIE_NAME, activeTheme);
    document.cookie = `${THEME_COOKIE_NAME}=${activeTheme}; path=/; max-age=31536000; samesite=lax`;
  }, [activeTheme]);

  useEffect(() => {
    setActiveTheme(theme);
  }, [theme]);

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem(LOCALE_COOKIE_NAME, activeLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${activeLocale}; path=/; max-age=31536000; samesite=lax`;

    if (activeLocale !== locale) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [activeLocale, locale, router]);

  const navItems = [
    { href: "/tournaments", label: copy.header.nav.tournaments },
    { href: "/games", label: copy.header.nav.games },
    { href: "/teams", label: copy.header.nav.leaderboard },
    ...(currentUser ? [{ href: "/admin", label: copy.header.nav.admin }] : []),
    { href: "/#about", label: copy.header.nav.about },
  ];

  function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === activeLocale) {
      return;
    }

    setActiveLocale(nextLocale);
  }

  function handleThemeChange(nextTheme: Theme) {
    setActiveTheme(nextTheme);
  }

  function isNavItemActive(href: string) {
    const [targetPath, targetHash] = href.split("#");

    if (targetHash) {
      return pathname === targetPath && activeHash === `#${targetHash}`;
    }

    if (targetPath === "/") {
      return pathname === "/";
    }

    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  }

  return (
    <header className="clutch-shell-header">
      <div className="clutch-shell-header__inner">
        <Link href="/" className="clutch-shell-brand clutch-brand" aria-label={copy.header.homeLabel}>
          <span className="clutch-brand__bolt" aria-hidden />
          <span className="clutch-brand__text">
            CLUTCH
            <span>ZONE</span>
          </span>
        </Link>

        <button
          type="button"
          className="clutch-shell-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="clutch-shell-menu"
          aria-label={menuOpen ? copy.header.mobileMenu.close : copy.header.mobileMenu.open}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div id="clutch-shell-menu" className={`clutch-shell-header__content ${menuOpen ? "is-open" : ""}`}>
          <nav className="clutch-shell-nav" aria-label={copy.header.navigationLabel}>
            {navItems.map((item) => {
              const isActive = isNavItemActive(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`clutch-shell-nav__link ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? (item.href.includes("#") ? "location" : "page") : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="clutch-shell-toolbar">
            <div className="clutch-shell-preferences" aria-label={copy.header.preferencesLabel}>
              <div className="clutch-shell-segmented" role="group" aria-label={copy.header.locale.label}>
                {supportedLocales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`clutch-shell-segmented__button ${activeLocale === item ? "is-active" : ""}`}
                    onClick={() => handleLocaleChange(item)}
                  >
                    {copy.header.locale[item]}
                  </button>
                ))}
              </div>

              <div className="clutch-shell-segmented" role="group" aria-label={copy.header.theme.label}>
                {supportedThemes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`clutch-shell-segmented__button ${activeTheme === item ? "is-active" : ""}`}
                    onClick={() => handleThemeChange(item)}
                  >
                    {copy.header.theme[item]}
                  </button>
                ))}
              </div>
            </div>

            <div className="clutch-shell-actions">
              {currentUser ? (
                <Link
                  href="/profile"
                  className="clutch-shell-action clutch-shell-action--ghost"
                  onClick={() => setMenuOpen(false)}
                >
                  {currentUser.nickname}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="clutch-shell-action clutch-shell-action--primary"
                  onClick={() => setMenuOpen(false)}
                >
                  {copy.header.actions.logIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
