import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { User } from "@/lib/types";

const navItems = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Leaderboard" },
  { href: "/tournaments", label: "News" },
  { href: "/#about", label: "About" },
];

export function SiteHeader({ currentUser }: { currentUser: User | null }) {
  return (
    <header className="clutch-shell-header">
      <div className="clutch-shell-header__inner">
        <Link href="/" className="clutch-shell-brand clutch-brand" aria-label="ClutchZone home">
          <span className="clutch-brand__bolt" aria-hidden />
          <span className="clutch-brand__text">
            CLUTCH
            <span>ZONE</span>
          </span>
        </Link>

        <nav className="clutch-shell-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="clutch-shell-nav__link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="clutch-shell-actions">
          {currentUser ? (
            <>
              <Link href="/profile" className="clutch-shell-action clutch-shell-action--ghost">
                {currentUser.nickname}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="clutch-shell-action clutch-shell-action--primary">
                  Log Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="clutch-shell-action clutch-shell-action--ghost">
                Log In
              </Link>
              <Link href="/register" className="clutch-shell-action clutch-shell-action--primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
