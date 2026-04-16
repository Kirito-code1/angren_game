import Image from "next/image";
import Link from "next/link";
import { FlashMessage } from "@/components/flash-message";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getDisciplineDescription } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatPrizePool } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import type { Locale } from "@/lib/ui-preferences";
import { getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(value);
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.games;
  const displayStore = getDisplayStore(store);

  const disciplines = displayStore.disciplines.map((discipline) => {
    const tournaments = getTournamentsByDiscipline(displayStore, discipline.slug);
    const liveTournaments = sortByDate(
      tournaments.filter((tournament) => tournament.status !== "completed"),
    );
    const totalPrizePool = tournaments.reduce(
      (sum, tournament) => sum + tournament.prizePoolUSD,
      0,
    );
    const participatingTeams = new Set(
      tournaments.flatMap((tournament) => tournament.approvedTeamIds),
    ).size;

    return {
      discipline,
      tournaments,
      liveTournaments,
      totalPrizePool,
      participatingTeams,
      nextTournament: liveTournaments[0] ?? tournaments[0] ?? null,
      visual: disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"],
      description: getDisciplineDescription(locale, discipline.slug, discipline.description),
    };
  });

  const featured = disciplines[0] ?? null;
  const secondary = disciplines[1] ?? featured;
  const latestTournaments = sortByDate(displayStore.tournaments).slice(0, 4);

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-page__header">
        <div>
          <p className="clutch-page__eyebrow">{copy.eyebrow}</p>
          <h1 className="clutch-page__title">{copy.title}</h1>
        </div>

        <div className="clutch-toolbar">
          <span className="clutch-toolbar__pill is-active">
            {copy.toolbar.titles}
            <strong>{formatCount(displayStore.disciplines.length, locale)}</strong>
          </span>
          <span className="clutch-toolbar__pill">
            {copy.toolbar.liveEvents}
            <strong>
              {formatCount(
                displayStore.tournaments.filter((tournament) => tournament.status !== "completed")
                  .length,
                locale,
              )}
            </strong>
          </span>
          <span className="clutch-toolbar__pill">
            {copy.toolbar.teams}
            <strong>{formatCount(displayStore.teams.length, locale)}</strong>
          </span>
        </div>
      </section>

      {featured ? (
        <section className="landing-split">
          <article className="landing-showcase landing-showcase--feature">
            <div className="landing-showcase__media">
              <Image
                src={featured.visual.art}
                alt={`Artwork for ${featured.discipline.shortTitle}`}
                fill
                priority
                sizes="(min-width: 1100px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="landing-showcase__overlay" />
            <div className="landing-showcase__content">
              <div className="landing-showcase__tags">
                <span className={`landing-chip ${featured.visual.badgeClass}`}>
                  {featured.visual.label}
                </span>
                <span className="landing-chip landing-chip--glass">
                  {featured.nextTournament?.format ?? featured.discipline.formats.join(" / ")}
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="landing-showcase__title">{featured.discipline.title}</h2>
                <p className="landing-showcase__copy">{featured.description}</p>
              </div>

              <div className="landing-showcase__footer">
                <span>
                  {featured.nextTournament
                    ? formatDate(featured.nextTournament.startsAt, locale)
                    : copy.comingSoon}
                </span>
                <span>
                  {formatCount(featured.participatingTeams || featured.tournaments.length, locale)}{" "}
                  {dict.common.teams.toLowerCase()}
                </span>
              </div>

              <div className="landing-hero__actions">
                <Link
                  href={`/games/${featured.discipline.slug}`}
                  className="clutch-action-button"
                >
                  {copy.openGame}
                </Link>
                <Link href="/tournaments" className="clutch-ghost-button">
                  {copy.browseTournaments}
                </Link>
              </div>
            </div>
          </article>

          <div className="grid gap-4">
            {secondary ? (
              <article
                className={`landing-game-card min-h-[20rem] ${
                  secondary.discipline.slug === "mobile-legends"
                    ? "landing-game-card--mlbb"
                    : "landing-game-card--pubg"
                }`}
              >
                <div className="landing-game-card__visual">
                  <Image
                    src={secondary.visual.art}
                    alt={`Artwork for ${secondary.discipline.shortTitle}`}
                    fill
                    sizes="(min-width: 1100px) 26vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="landing-game-card__body">
                  <div className="landing-game-card__header">
                    <span className={`landing-chip ${secondary.visual.badgeClass}`}>
                      {secondary.visual.label}
                    </span>
                    <span className="landing-chip landing-chip--soft">
                      {formatCount(secondary.liveTournaments.length, locale)} {copy.liveNow}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="landing-game-card__title">{secondary.discipline.shortTitle}</h2>
                    <p className="landing-game-card__copy">{secondary.description}</p>
                  </div>
                  <div className="landing-game-card__stats">
                    <div>
                      <span>{copy.prizePool}</span>
                      <strong>{formatPrizePool(secondary.totalPrizePool || 0, locale)}</strong>
                    </div>
                    <div>
                      <span>{dict.common.formats}</span>
                      <strong>{secondary.discipline.formats.join(" / ")}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            <article className="landing-panel">
              <div className="landing-panel__header">
                <div>
                  <p className="landing-section-tag">{copy.latestEvents}</p>
                  <h2 className="landing-panel__title">{copy.calendar}</h2>
                </div>
                <Link href="/tournaments" className="clutch-table-link">
                  {copy.viewAll}
                </Link>
              </div>

              <div className="landing-event-list mt-4">
                {latestTournaments.length > 0 ? (
                  latestTournaments.map((tournament) => {
                    const discipline = displayStore.disciplines.find(
                      (entry) => entry.slug === tournament.disciplineSlug,
                    );

                    return (
                      <article key={tournament.id} className="landing-event-item">
                        <span className="landing-event-item__symbol">
                          {discipline?.icon ?? "GM"}
                        </span>
                        <div className="landing-event-item__body">
                          <h3 className="landing-event-item__title">{tournament.title}</h3>
                          <p className="landing-event-item__copy">
                            {discipline?.shortTitle ?? tournament.disciplineSlug} • {formatDate(tournament.startsAt, locale)}
                          </p>
                        </div>
                        <div className="landing-event-item__aside">
                          <strong>{formatPrizePool(tournament.prizePoolUSD, locale)}</strong>
                          <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                            {dict.common.open}
                          </Link>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="clutch-empty-panel">
                    {copy.empty}
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="landing-section gap-6">
        <div className="landing-section-heading">
          <span className="landing-section-tag">{copy.title}</span>
          <h2 className="landing-section-title">{copy.builtTitle}</h2>
          <p className="landing-section-copy">{copy.builtCopy}</p>
        </div>

        <div className="landing-battle-grid">
          {disciplines.map((item) => (
            <article
              key={item.discipline.slug}
              className={`landing-game-card ${
                item.discipline.slug === "mobile-legends"
                  ? "landing-game-card--mlbb"
                  : "landing-game-card--pubg"
              }`}
            >
              <div className="landing-game-card__visual">
                <Image
                  src={item.visual.art}
                  alt={`Poster for ${item.discipline.shortTitle}`}
                  fill
                  sizes="(min-width: 768px) 44vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="landing-game-card__body">
                <div className="landing-game-card__header">
                  <span className={`landing-chip ${item.visual.badgeClass}`}>{item.visual.label}</span>
                  <span className="landing-chip landing-chip--soft">
                    {item.liveTournaments.length > 0 ? copy.liveCalendar : copy.comingSoon}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="landing-game-card__title">{item.discipline.title}</h3>
                  <p className="landing-game-card__copy">{item.description}</p>
                </div>

                <div className="landing-game-card__stats">
                  <div>
                    <span>{copy.nextEvent}</span>
                    <strong>
                      {item.nextTournament
                        ? formatDate(item.nextTournament.startsAt, locale)
                        : copy.notScheduled}
                    </strong>
                  </div>
                  <div>
                    <span>{dict.common.teams}</span>
                    <strong>{formatCount(item.participatingTeams || item.tournaments.length, locale)}</strong>
                  </div>
                </div>

                <div className="landing-game-card__footer">
                  <Link href={`/games/${item.discipline.slug}`} className="clutch-action-button">
                    {copy.openGame}
                  </Link>
                  <Link href="/teams" className="clutch-ghost-button">
                    {copy.leaderboard}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
