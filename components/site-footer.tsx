import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "/tournaments", label: "Tournaments" },
      { href: "/teams", label: "Leaderboard" },
      { href: "/games", label: "Games" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#about", label: "About Us" },
      { href: "/tournaments", label: "Careers" },
      { href: "/#about", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/tournaments", label: "Help Center" },
      { href: "/tournaments", label: "Terms of Service" },
      { href: "/tournaments", label: "Privacy Policy" },
    ],
  },
];

const socialLinks = [
  { href: "/#", label: "Discord", icon: "/social/discord.svg" },
  { href: "/#", label: "Twitter", icon: "/social/twitter.svg" },
  { href: "/#", label: "YouTube", icon: "/social/youtube.svg" },
  { href: "/#", label: "Instagram", icon: "/social/instagram.svg" },
];

export function SiteFooter() {
  return (
    <footer id="about" className="clutch-footer">
      <div className="clutch-footer__inner">
        <Link href="/register" className="clutch-footer__cta" aria-label="Join the Zone">
          <div className="clutch-footer__cta-copy">
            <span className="clutch-brand clutch-brand--footer">
              <span className="clutch-brand__bolt" aria-hidden />
              <span className="clutch-brand__text">
                CLUTCH
                <span>ZONE</span>
              </span>
            </span>
            <p>
              Your skills. Our platform. Infinite opportunities.
              <br />
              The next champion could be you.
            </p>
          </div>

          <span className="clutch-footer__cta-button">
            Join the Zone
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
            <p>© 2024 ClutchZone. All rights reserved.</p>
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

          <div className="clutch-footer__column clutch-footer__column--social">
            <h3>Follow Us</h3>
            <div className="clutch-footer__socials">
              {socialLinks.map((item) => (
                <Link key={item.label} href={item.href} className="clutch-footer__social-link">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={22}
                    height={22}
                    sizes="22px"
                    className="clutch-footer__social-icon"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}
