import Image from "next/image";
import Link from "next/link";
import { FlashMessage } from "@/components/flash-message";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatPrizePool, formatTournamentStatus } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import type { Locale } from "@/lib/ui-preferences";
import { getTournamentsByStatus } from "@/lib/selectors";
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

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function matchesPrizeRange(prizePoolUSD: number, range: string) {
  if (!range) {
    return true;
  }

  if (range === "0-500") {
    return prizePoolUSD <= 500;
  }

  if (range === "500-2000") {
    return prizePoolUSD > 500 && prizePoolUSD <= 2000;
  }

  if (range === "2000+") {
    return prizePoolUSD > 2000;
  }

  return true;
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const query = getSingleValue(resolvedParams.q).trim().toLowerCase();
  const selectedGame = getSingleValue(resolvedParams.game).trim().toLowerCase();
  const selectedStatus = getSingleValue(resolvedParams.status).trim().toLowerCase();
  const selectedPrize = getSingleValue(resolvedParams.prize).trim().toLowerCase();
  const hasActiveFilters = Boolean(query || selectedGame || selectedStatus || selectedPrize);

  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.tournaments;
  const displayStore = getDisplayStore(store);

  const open = getTournamentsByStatus(displayStore, "registration_open");
  const ongoing = getTournamentsByStatus(displayStore, "ongoing");
  const completed = getTournamentsByStatus(displayStore, "completed");
  const tournaments = sortByDate([...ongoing, ...open, ...completed]);
  const filteredTournaments = tournaments.filter((tournament) => {
    const discipline = displayStore.disciplines.find(
      (entry) => entry.slug === tournament.disciplineSlug,
    );
    const searchTarget = [
      tournament.title,
      tournament.format,
      discipline?.title ?? "",
      discipline?.shortTitle ?? "",
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchTarget.includes(query)) {
      return false;
    }

    if (selectedGame && tournament.disciplineSlug !== selectedGame) {
      return false;
    }

    if (selectedStatus && tournament.status !== selectedStatus) {
      return false;
    }

    return matchesPrizeRange(tournament.prizePoolUSD, selectedPrize);
  });

  const filteredOpen = filteredTournaments.filter(
    (tournament) => tournament.status === "registration_open",
  );
  const filteredOngoing = filteredTournaments.filter((tournament) => tournament.status === "ongoing");
  const filteredCompleted = filteredTournaments.filter(
    (tournament) => tournament.status === "completed",
  );
  const featuredTournament = filteredTournaments[0] ?? tournaments[0] ?? null;
  const totalPrizePool = (filteredTournaments.length > 0 ? filteredTournaments : tournaments).reduce(
    (sum, tournament) => sum + tournament.prizePoolUSD,
    0,
  );

  const filterItems = [
    { label: dict.common.all, value: filteredTournaments.length },
    { label: dict.common.live, value: filteredOngoing.length },
    { label: dict.common.registrationOpen, value: filteredOpen.length },
    { label: dict.common.completed, value: filteredCompleted.length },
  ];

  return (
    <div className="clutch-page">
      <FlashMessage message={message} />

      <section className="clutch-page__header">
        <div className="clutch-page__header-main">
          <p className="clutch-page__eyebrow">{copy.eyebrow}</p>
          <h1 className="clutch-page__title">{copy.title}</h1>

          <form method="get" className="clutch-mock-toolbar" role="search" aria-label={copy.title}>
            <input
              type="search"
              name="q"
              placeholder={copy.searchPlaceholder}
              className="clutch-mock-search"
              autoComplete="off"
              defaultValue={getSingleValue(resolvedParams.q)}
            />
            <select
              name="game"
              className="clutch-mock-select"
              aria-label={copy.filters.game}
              defaultValue={selectedGame}
            >
              <option value="">{copy.filters.game}</option>
              {displayStore.disciplines.map((discipline) => (
                <option key={discipline.slug} value={discipline.slug}>
                  {discipline.shortTitle}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="clutch-mock-select"
              aria-label={copy.filters.status}
              defaultValue={selectedStatus}
            >
              <option value="">{copy.filters.status}</option>
              <option value="ongoing">{dict.common.live}</option>
              <option value="registration_open">{dict.common.registrationOpen}</option>
              <option value="completed">{dict.common.completed}</option>
            </select>
            <select
              name="prize"
              className="clutch-mock-select"
              aria-label={copy.filters.prizePool}
              defaultValue={selectedPrize}
            >
              <option value="">{copy.filters.prizePool}</option>
              <option value="0-500">$0 - $500</option>
              <option value="500-2000">$500 - $2,000</option>
              <option value="2000+">$2,000+</option>
            </select>
            <button type="submit" className="clutch-action-button">
              {dict.common.apply}
            </button>
            {hasActiveFilters ? (
              <Link href="/tournaments" className="clutch-table-link">
                {dict.common.clear}
              </Link>
            ) : null}
          </form>
        </div>

        <div className="clutch-toolbar clutch-page__header-filters">
          {filterItems.map((item, index) => (
            <span key={item.label} className={`clutch-toolbar__pill ${index === 0 ? "is-active" : ""}`}>
              {item.label}
              <strong>{formatCount(item.value, locale)}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="clutch-list-layout">
        <div className="clutch-list-shell">
          <div className="clutch-list-shell__bar">
            <span>{hasActiveFilters ? copy.filteredTitle : copy.listTitle}</span>
            <span>{formatCount(filteredTournaments.length, locale)} {copy.total}</span>
          </div>

          {filteredTournaments.length > 0 ? (
            <div className="clutch-tournament-list">
              {filteredTournaments.map((tournament) => {
                const discipline = displayStore.disciplines.find(
                  (entry) => entry.slug === tournament.disciplineSlug,
                );
                const design =
                  disciplineDesigns[tournament.disciplineSlug] ?? disciplineDesigns["pubg-mobile"];
                const statusLabel = formatTournamentStatus(tournament.status, locale);
                const statusBadgeClass =
                  tournament.status === "ongoing"
                    ? "clutch-status-badge--live"
                    : tournament.status === "registration_open"
                      ? "clutch-status-badge--open"
                      : "clutch-status-badge--ended";
                const ctaLabel =
                  tournament.status === "completed" ? copy.openResults : copy.openTournament;

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
                      <span className={`clutch-status-badge ${statusBadgeClass}`}>{statusLabel}</span>
                    </div>

                    <div className="clutch-tournament-row__body">
                      <div className="clutch-tournament-row__top">
                        <div className="space-y-2">
                          <div className="clutch-tournament-row__meta">
                            <span>{discipline?.shortTitle ?? tournament.disciplineSlug}</span>
                            <span>{tournament.format}</span>
                            <span>{formatDate(tournament.startsAt, locale)}</span>
                          </div>
                          <h2 className="clutch-tournament-row__title">{tournament.title}</h2>
                        </div>

                        <div className="clutch-tournament-row__stats">
                          <div>
                            <span>{dict.common.prizePool}</span>
                            <strong>{formatPrizePool(tournament.prizePoolUSD, locale)}</strong>
                          </div>
                          <div>
                            <span>{dict.common.teams}</span>
                            <strong>
                              {tournament.approvedTeamIds.length}/{tournament.teamLimit}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="clutch-tournament-row__bottom">
                        <p className="clutch-tournament-row__copy">
                          {tournament.status === "completed"
                            ? copy.completedCopy
                            : copy.activeCopy}
                        </p>
                        <Link href={`/tournaments/${tournament.id}`} className="clutch-action-button">
                          {ctaLabel}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="clutch-empty-panel">
              {tournaments.length === 0
                ? copy.noPublished
                : copy.noMatch}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={tournaments.length === 0 ? "/admin" : "/tournaments"} className="clutch-action-button">
                  {tournaments.length === 0 ? dict.common.openAdmin : dict.common.clear}
                </Link>
                <Link href="/games" className="clutch-ghost-button">
                  {dict.common.browseEvents}
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="clutch-sidebar">
          <article className="clutch-sidebar-card">
            <div className="clutch-sidebar-card__header">
              <h2>{copy.popularGames}</h2>
              <span>{displayStore.disciplines.length} {copy.titles}</span>
            </div>

            <div className="clutch-game-stack">
              {displayStore.disciplines.map((discipline) => {
                const design = disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"];

                return (
                  <article key={discipline.slug} className="clutch-game-mini">
                    <div className="clutch-game-mini__thumb">
                      <Image
                        src={design.art}
                        alt={`Artwork for ${discipline.shortTitle}`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <strong>{discipline.shortTitle}</strong>
                      <span>{discipline.formats.join(" / ")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">{copy.prizeTracker}</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {featuredTournament ? featuredTournament.title : copy.currentPool}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>{formatPrizePool(totalPrizePool, locale)}</strong>
              <span>
                {hasActiveFilters ? copy.withinFiltered : copy.acrossPublished}
              </span>
            </div>

            <div className="clutch-sidebar-card__promo-art">
              <Image
                src="/game_img/16779410.png"
                alt={copy.prizeTracker}
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
