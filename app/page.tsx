import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { FlashMessage } from "@/components/flash-message";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getDisciplineDescription } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatPrizePool } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import type { Locale } from "@/lib/ui-preferences";
import { getTeamById, getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";
import styles from "./page.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

const featureIcons = [
  "/game_img/16779410.png",
  "/game_img/17931527.png",
  "/game_img/7049364.png",
  "/game_img/7694085.png",
];

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(value);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const { locale, dict } = await getI18n();
  const displayStore = getDisplayStore(store);
  const copy = dict.home;

  const totalPrizePool = displayStore.tournaments.reduce(
    (sum, tournament) => sum + tournament.prizePoolUSD,
    0,
  );
  const heroStatItems = [
    { value: formatCount(displayStore.users.length, locale), label: copy.stats.players },
    { value: formatCount(displayStore.teams.length, locale), label: copy.stats.teams },
    { value: formatCount(displayStore.tournaments.length, locale), label: copy.stats.tournaments },
  ];
  const teamHeroBadges = displayStore.teams
    .slice(0, 3)
    .map((team) => team.logo)
    .filter((logo): logo is string => Boolean(logo));
  const heroBadges =
    teamHeroBadges.length > 0
      ? teamHeroBadges
      : displayStore.disciplines.slice(0, 3).map((discipline) => discipline.icon);
  const featuredDiscipline =
    displayStore.disciplines.find((discipline) => discipline.featured) ??
    displayStore.disciplines[0] ??
    null;
  const featuredDesign = featuredDiscipline
    ? disciplineDesigns[featuredDiscipline.slug] ?? disciplineDesigns["pubg-mobile"]
    : disciplineDesigns["pubg-mobile"];

  const battleCardItems = displayStore.disciplines.slice(0, 2).map((discipline) => {
    const tournaments = sortByDate(getTournamentsByDiscipline(displayStore, discipline.slug));
    const nextTournament =
      tournaments.find((tournament) => tournament.status !== "completed") ?? tournaments[0] ?? null;
    const confirmedTeamIds = Array.from(
      new Set(tournaments.flatMap((tournament) => tournament.approvedTeamIds)),
    );
    const teamBadges = confirmedTeamIds
      .map((teamId) => getTeamById(displayStore, teamId)?.logo ?? null)
      .filter((logo): logo is string => Boolean(logo))
      .slice(0, 3);
    const design = disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"];
    const localizedDescription = getDisciplineDescription(locale, discipline.slug, discipline.description);
    const metaLabel =
      confirmedTeamIds.length > 0
        ? `${formatCount(confirmedTeamIds.length, locale)} ${copy.meta.confirmedTeams}`
        : tournaments.length > 0
          ? `${formatCount(tournaments.length, locale)} ${copy.meta.publishedTournaments}`
          : copy.meta.noTournaments;

    return {
      href: nextTournament ? `/tournaments/${nextTournament.id}` : `/games/${discipline.slug}`,
      image: design.art,
      alt: `Artwork for ${discipline.title}`,
      badge: design.label,
      tone: discipline.slug === "mobile-legends" ? "violet" : "gold",
      title: discipline.title,
      copy: nextTournament
        ? `${localizedDescription}\n${copy.meta.nextStart}: ${formatDate(nextTournament.startsAt, locale)}`
        : `${localizedDescription}\n${copy.meta.formats}: ${discipline.formats.join(" / ")}`,
      metaLabel,
      badges: teamBadges.length > 0 ? teamBadges : [discipline.icon],
      ctaLabel: nextTournament ? dict.common.openTournament : dict.common.openGame,
    };
  });

  return (
    <div className={styles.home}>
      <FlashMessage message={message} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>{copy.kicker}</span>

          <div className={styles.heroTextGroup}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>{copy.titleLine1}</span>
              <span className={styles.heroTitleLine2}>
                <span className={styles.clutchWord}>{copy.clutchWord}</span>
                <span className={styles.victoryWord}>{copy.victoryWord}</span>
              </span>
            </h1>
            <p className={styles.heroBody}>{copy.body}</p>
          </div>

          <div className={styles.heroActions}>
            <Link href="/tournaments" className={styles.primaryAction}>
              {copy.primaryAction}
              <span aria-hidden>↗</span>
            </Link>
            <Link href="/games" className={styles.secondaryAction}>
              {copy.secondaryAction}
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroAvatars} aria-hidden>
              {heroBadges.slice(0, 3).map((badge) => (
                <span key={badge} className={styles.heroAvatar}>
                  {badge}
                </span>
              ))}
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
              src={featuredDesign.art}
              alt={featuredDiscipline ? `${featuredDiscipline.title} artwork` : "Tournament artwork"}
              fill
              priority
              sizes="(min-width: 1100px) 52vw, 100vw"
              className={styles.heroPosterImage}
            />
            <span className={`${styles.heroPosterMark} ${styles.heroPosterMarkPubg}`}>
              <span>{featuredDesign.label}</span>
              <small>{formatPrizePool(totalPrizePool, locale)} {copy.posterSuffix}</small>
            </span>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>{copy.chooseTitle}</h2>
          <p>{copy.chooseCopy}</p>
        </div>

        <div className={styles.battleGrid}>
          {battleCardItems.map((item) => {
            const badgeClass =
              item.tone === "gold" ? styles.posterBadgeGold : styles.posterBadgeViolet;
            const imageClass =
              item.tone === "gold"
                ? styles.battleCardImage
                : `${styles.battleCardImage} ${styles.battleCardImageSecondary}`;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`${styles.battleCard} ${
                  item.tone === "violet" ? styles.battleCardViolet : ""
                }`}
                aria-label={`${dict.common.open} ${item.title}`}
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
                      {item.badges.map((badge) => (
                        <span key={badge} className={styles.battleCardAvatar}>
                          {badge}
                        </span>
                      ))}
                    </div>
                    <span>{item.metaLabel}</span>
                  </div>
                  <div className={styles.cardLink}>
                    {item.ctaLabel}
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
          <h2>{copy.builtTitle}</h2>
          <p>{copy.builtCopy}</p>
        </div>

        <div className={styles.featureGrid}>
          {copy.featureCards.map((feature, index) => (
            <article key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIconShell}>
                <Image
                  src={featureIcons[index] ?? featureIcons[0]}
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
