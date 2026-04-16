import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/ui-preferences";

const currentYear = new Date().getFullYear();

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale);
  const footerColumns = [
    {
      title: copy.footer.columns.platform,
      links: [
        { href: "/tournaments", label: copy.footer.links.tournaments },
        { href: "/teams", label: copy.footer.links.leaderboard },
        { href: "/games", label: copy.footer.links.games },
        { href: "/#about", label: copy.footer.links.about },
      ],
    },
    {
      title: copy.footer.columns.account,
      links: [
        { href: "/login", label: copy.footer.links.login },
        { href: "/login?mode=register", label: copy.footer.links.signup },
        { href: "/profile", label: copy.footer.links.profile },
      ],
    },
  ];

  return (
    <footer id="about" className="clutch-footer">
      <div className="clutch-footer__inner">
        <Link href="/login?mode=register" className="clutch-footer__cta" aria-label={copy.footer.cta.label}>
          <div className="clutch-footer__cta-copy">
            <span className="clutch-brand clutch-brand--footer">
              <span className="clutch-brand__bolt" aria-hidden />
              <span className="clutch-brand__text">
                CLUTCH
                <span>ZONE</span>
              </span>
            </span>
            <p>
              {copy.footer.cta.body1}
              <br />
              {copy.footer.cta.body2}
            </p>
          </div>

          <span className="clutch-footer__cta-button">
            {copy.footer.cta.label}
            <span aria-hidden>↗</span>
          </span>

          <div className="clutch-footer__cta-art" aria-hidden>
            <div className="clutch-footer__cta-art-item clutch-footer__cta-art-item--trophy">
              <Image
                src="/game_img/16779410.png"
                alt=""
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>
            <div className="clutch-footer__cta-art-item clutch-footer__cta-art-item--badge">
              <Image
                src="/game_img/7694085.png"
                alt=""
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>
          </div>
        </Link>

        <section className="clutch-footer__meta">
          <div className="clutch-footer__column clutch-footer__column--brand">
            <h3>ClutchZone</h3>
            <p>© {currentYear} ClutchZone. {copy.footer.brandCopy}</p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="clutch-footer__column">
              <h3>{column.title}</h3>
              <div className="clutch-footer__links">
                {column.links.map((link) => (
                  <Link key={`${column.title}-${link.label}`} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </footer>
  );
}
