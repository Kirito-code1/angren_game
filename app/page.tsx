import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { FlashMessage } from "@/components/flash-message";
import styles from "./page.module.css";
import { getDisplayStore } from "@/lib/design-data";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

const featureCards = [
  {
    icon: "/game_img/16779410.png",
    title: "FAIR COMPETITION",
    copy: "Advanced anti-cheat and fair matchmaking.",
  },
  {
    icon: "/game_img/17931527.png",
    title: "EASY TO JOIN",
    copy: "Quick registration and seamless tournament entry.",
  },
  {
    icon: "/game_img/7049364.png",
    title: "TRACK & CLIMB",
    copy: "Live stats, leaderboards, and rank progression.",
  },
  {
    icon: "/game_img/7694085.png",
    title: "WIN REWARDS",
    copy: "Cash prizes, in-game items, and exclusive perks.",
  },
];

const heroStatItems = [
  { value: "50K+", label: "PLAYERS" },
  { value: "1K+", label: "TOURNAMENTS" },
  { value: "$100K+", label: "PRIZE POOL" },
];

const battleCardItems = [
  {
    href: "pubg",
    image: "/game_img/pubg.webp",
    alt: "PUBG Battlegrounds artwork",
    badge: "PUBG",
    tone: "gold",
    title: "PUBG BATTLEGROUNDS",
    copy: "100 players. One winner.\nSurvive, strategize, and be the last one standing.",
    players: "25K+ Players",
    avatars: ["AE", "DB", "DS"],
  },
  {
    href: "mlbb",
    image: "/game_img/Mobile_Legends_Bang_Bang_ML.webp",
    alt: "Mobile Legends Bang Bang artwork",
    badge: "MLBB",
    tone: "violet",
    title: "MOBILE LEGENDS BANG",
    copy: "5v5 action. Infinite possibilities.\nTeam up, dominate, and become legends.",
    players: "30K+ Players",
    avatars: ["ML", "NB", "RF"],
  },
] as const;

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const displayStore = getDisplayStore(store);

  const pubg = displayStore.disciplines.find((discipline) => discipline.slug === "pubg-mobile");
  const mlbb = displayStore.disciplines.find((discipline) => discipline.slug === "mobile-legends");
  const pubgTournament = pubg
    ? sortByDate(getTournamentsByDiscipline(displayStore, pubg.slug))[0] ?? null
    : null;
  const mlbbTournament = mlbb
    ? sortByDate(getTournamentsByDiscipline(displayStore, mlbb.slug))[0] ?? null
    : null;
  const pubgTournamentHref = pubgTournament ? `/tournaments/${pubgTournament.id}` : "/tournaments";
  const mlbbTournamentHref = mlbbTournament ? `/tournaments/${mlbbTournament.id}` : "/tournaments";

  return (
    <div className={styles.home}>
      <FlashMessage message={message} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Compete. Climb. Conquer.</span>

          <div className={styles.heroTextGroup}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Where Players</span>
              <span className={styles.heroTitleLine2}>
                <span className={styles.clutchWord}>Clutch</span>
                <span className={styles.victoryWord}>Victory</span>
              </span>
            </h1>
            <p className={styles.heroBody}>
              Join tournaments, prove your skills, and win epic rewards. Your next big win is waiting.
            </p>
          </div>

          <div className={styles.heroActions}>
            <Link href="/tournaments" className={styles.primaryAction}>
              Join Tournament
              <span aria-hidden>↗</span>
            </Link>
            <Link href="/games" className={styles.secondaryAction}>
              Browse Events
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroAvatars} aria-hidden>
              <span className={styles.heroAvatar}>AE</span>
              <span className={styles.heroAvatar}>DB</span>
              <span className={styles.heroAvatar}>DS</span>
            </div>

            {heroStatItems.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 ? (
                  <span className={styles.heroStatSep} aria-hidden>
                    ›
                  </span>
                ) : null}
                <div className={styles.heroStat}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        <div className={styles.heroMedia}>
          <article className={styles.heroPoster}>
            <Image
              src="/game_img/pubg.webp"
              alt="PUBG Mobile artwork"
              fill
              priority
              sizes="(min-width: 1100px) 52vw, 100vw"
              className={styles.heroPosterImage}
            />
            <span className={`${styles.heroPosterMark} ${styles.heroPosterMarkPubg}`}>
              <span>PUBG</span>
              <small>BATTLEGROUNDS</small>
            </span>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>CHOOSE YOUR BATTLEFIELD</h2>
          <p>Compete in your favorite games. Only the best rise to the top.</p>
        </div>

        <div className={styles.battleGrid}>
          {battleCardItems.map((item) => {
            const href = item.href === "pubg" ? pubgTournamentHref : mlbbTournamentHref;
            const badgeClass =
              item.tone === "gold" ? styles.posterBadgeGold : styles.posterBadgeViolet;
            const imageClass =
              item.tone === "gold"
                ? styles.battleCardImage
                : `${styles.battleCardImage} ${styles.battleCardImageSecondary}`;

            return (
              <Link
                key={item.title}
                href={href}
                className={`${styles.battleCard} ${
                  item.tone === "violet" ? styles.battleCardViolet : ""
                }`}
                aria-label={`View ${item.title} tournaments`}
              >
                <div className={styles.battleCardMedia}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 1099px) 100vw, 386px"
                    className={imageClass}
                  />
                </div>

                <div className={styles.battleCardContent}>
                  <span className={`${styles.posterBadge} ${badgeClass}`}>{item.badge}</span>
                  <div className={styles.battleCardText}>
                    <h3>{item.title}</h3>
                    <p>
                      {item.copy.split("\n").map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className={styles.battleCardMeta}>
                    <div className={styles.battleCardAvatars} aria-hidden>
                      {item.avatars.map((avatar) => (
                        <span key={avatar} className={styles.battleCardAvatar}>
                          {avatar}
                        </span>
                      ))}
                    </div>
                    <span>{item.players}</span>
                  </div>
                  <div className={styles.cardLink}>
                    View Tournaments
                    <span aria-hidden>↗</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>BUILT FOR COMPETITORS</h2>
          <p>Everything you need to compete, win, and grow.</p>
        </div>

        <div className={styles.featureGrid}>
          {featureCards.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIconShell}>
                <Image
                  src={feature.icon}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className={styles.featureIcon}
                />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
