import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashMessage } from "@/components/flash-message";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getDisciplineDescription } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatPrizePool, formatTournamentStatus } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import type { Locale } from "@/lib/ui-preferences";
import { getDisciplineBySlug, getTournamentsByDiscipline } from "@/lib/selectors";
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

export default async function DisciplinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.gameDetail;
  const displayStore = getDisplayStore(store);

  const discipline = getDisciplineBySlug(displayStore, slug);

  if (!discipline) {
    notFound();
  }

  const design = disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"];
  const description = getDisciplineDescription(locale, discipline.slug, discipline.description);
  const tournaments = sortByDate(getTournamentsByDiscipline(displayStore, slug));
  const liveTournaments = tournaments.filter((tournament) => tournament.status !== "completed");
  const archiveTournaments = tournaments.filter((tournament) => tournament.status === "completed");
  const totalPrizePool = tournaments.reduce((sum, tournament) => sum + tournament.prizePoolUSD, 0);
  const participatingTeams = new Set(
    tournaments.flatMap((tournament) => tournament.approvedTeamIds),
  ).size;
  const featuredTournament = liveTournaments[0] ?? tournaments[0] ?? null;

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-detail-hero">
        <article className="clutch-detail-banner">
          <div className="clutch-detail-banner__media">
            <Image
              src={design.art}
              alt={`Artwork for ${discipline.title}`}
              fill
              priority
              sizes="(min-width: 1280px) 62vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="clutch-detail-banner__overlay" />
          <div className="clutch-detail-banner__content">
            <div className="clutch-detail-banner__top">
              <span className={`landing-chip ${design.badgeClass}`}>{design.label}</span>
              <span className="landing-chip landing-chip--glass">
                {featuredTournament?.format ?? discipline.formats.join(" / ")}
              </span>
            </div>

            <div className="space-y-3">
              <p className="clutch-page__eyebrow">{copy.overview}</p>
              <h1 className="clutch-detail-banner__title">{discipline.title}</h1>
              <p className="clutch-detail-banner__copy">{description}</p>
            </div>

            <div className="clutch-detail-banner__actions">
              <Link href="/games" className="clutch-ghost-button">
                {copy.backToGames}
              </Link>
              <Link href="/tournaments" className="clutch-action-button">
                {copy.browseEvents}
              </Link>
            </div>
          </div>
        </article>

        <aside className="clutch-detail-sidecard">
          <div className="clutch-detail-sidecard__stats">
            <article>
              <span>{copy.active}</span>
              <strong>{formatCount(liveTournaments.length, locale)}</strong>
            </article>
            <article>
              <span>{copy.archive}</span>
              <strong>{formatCount(archiveTournaments.length, locale)}</strong>
            </article>
            <article>
              <span>{copy.teams}</span>
              <strong>{formatCount(participatingTeams, locale)}</strong>
            </article>
            <article>
              <span>{copy.prizePool}</span>
              <strong>{formatPrizePool(totalPrizePool, locale)}</strong>
            </article>
          </div>

          <div className="clutch-detail-sidecard__organizer">
            <p>{copy.formats}</p>
            <strong>{discipline.formats.join(" / ")}</strong>
            <span>{discipline.shortTitle}</span>
          </div>

          <div className="clutch-detail-sidecard__summary">
            <span>{featuredTournament ? formatDate(featuredTournament.startsAt, locale) : copy.calendarPending}</span>
            <span>{featuredTournament ? featuredTournament.title : copy.noUpcoming}</span>
          </div>
        </aside>
      </section>

      <div className="clutch-tabs">
        <span className="is-active">{copy.overview}</span>
        <span>{liveTournaments.length} {copy.active}</span>
        <span>{archiveTournaments.length} {copy.archive}</span>
        <span>{discipline.formats.length} {copy.formats}</span>
      </div>

      <section className="clutch-list-layout">
        <div className="clutch-list-shell">
          <div className="clutch-list-shell__bar">
            <span>{discipline.shortTitle} {copy.tournamentsLabel}</span>
            <span>{formatCount(tournaments.length, locale)} {copy.total}</span>
          </div>

          {tournaments.length > 0 ? (
            <div className="clutch-tournament-list">
              {tournaments.map((tournament) => {
                const statusLabel = formatTournamentStatus(tournament.status, locale);

                return (
                  <article key={tournament.id} className="clutch-tournament-row">
                    <div className="clutch-tournament-row__media">
                      <Image
                        src={design.art}
                        alt={`Poster for ${tournament.title}`}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                      <span className={`clutch-status-badge ${design.accentClass}`}>{statusLabel}</span>
                    </div>

                    <div className="clutch-tournament-row__body">
                      <div className="clutch-tournament-row__top">
                        <div className="space-y-2">
                          <div className="clutch-tournament-row__meta">
                            <span>{discipline.shortTitle}</span>
                            <span>{tournament.format}</span>
                            <span>{formatDate(tournament.startsAt, locale)}</span>
                          </div>
                          <h2 className="clutch-tournament-row__title">{tournament.title}</h2>
                        </div>

                        <div className="clutch-tournament-row__stats">
                          <div>
                            <span>{copy.prizePool}</span>
                            <strong>{formatPrizePool(tournament.prizePoolUSD, locale)}</strong>
                          </div>
                          <div>
                            <span>{copy.teams}</span>
                            <strong>
                              {tournament.approvedTeamIds.length}/{tournament.teamLimit}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="clutch-tournament-row__bottom">
                        <p className="clutch-tournament-row__copy">
                          {tournament.status === "completed"
                            ? copy.completedEvent
                            : copy.openEvent}
                        </p>
                        <Link href={`/tournaments/${tournament.id}`} className="clutch-action-button">
                          {dict.common.openTournament}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="clutch-empty-panel">
              {copy.noTournaments}
            </div>
          )}
        </div>

        <aside className="clutch-sidebar">
          <article className="clutch-sidebar-card">
            <div className="clutch-sidebar-card__header">
              <h2>{copy.playbook}</h2>
              <span>{discipline.formats.length} {copy.modes}</span>
            </div>

            <div className="clutch-rules-list">
              {discipline.formats.map((format) => (
                <article key={format} className="clutch-rules-list__item">
                  {format}
                </article>
              ))}
            </div>
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">{copy.spotlight}</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {featuredTournament?.title ?? `${discipline.shortTitle} ${copy.season}`}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>
                {featuredTournament ? formatPrizePool(featuredTournament.prizePoolUSD, locale) : formatPrizePool(0, locale)}
              </strong>
              <span>{featuredTournament ? formatDate(featuredTournament.startsAt, locale) : copy.schedulePending}</span>
            </div>

            <div className="clutch-sidebar-card__promo-art">
              <Image
                src={design.art}
                alt={`Spotlight art for ${discipline.shortTitle}`}
                fill
                sizes="320px"
                className="object-contain"
              />
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
