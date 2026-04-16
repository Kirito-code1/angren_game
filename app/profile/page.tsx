import Image from "next/image";
import Link from "next/link";
import { updateProfileDisciplinesAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { ProfileDashboardSidebar } from "@/components/profile-dashboard-sidebar";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  formatCountry,
  formatDate,
  formatTournamentStatus,
  formatUserRole,
} from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamById, getTournamentById, matchesUserIdentifier } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

type ActivityEntry = {
  id: string;
  title: string;
  body: string;
  isoDate: string;
  href?: string;
};

function sortByDate<T extends { isoDate: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(right.isoDate).getTime() - new Date(left.isoDate).getTime(),
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.profile;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="clutch-page space-y-8">
        <FlashMessage message={message} />

        <section className="clutch-dashboard-card">
          <div className="space-y-4">
            <p className="clutch-page__eyebrow">{dict.common.profile}</p>
            <h1 className="clutch-page__title">{copy.title}</h1>
            <p className="clutch-detail-banner__copy">{copy.noAuthCopy}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="clutch-action-button">
              {dict.common.logIn}
            </Link>
            <Link href="/login?mode=register" className="clutch-ghost-button">
              {dict.common.signUp}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const displayStore = getDisplayStore(store);
  const team = currentUser.teamId ? getTeamById(displayStore, currentUser.teamId) : null;
  const historyTournaments = currentUser.tournamentHistory
    .map((tournamentId) => getTournamentById(displayStore, tournamentId))
    .filter((tournament): tournament is NonNullable<typeof tournament> => Boolean(tournament));
  const createdTournaments = displayStore.tournaments.filter((tournament) =>
    matchesUserIdentifier(currentUser, tournament.creatorUserId),
  );
  const needsDisciplineSelection = currentUser.disciplines.length === 0;
  const rankedTeams = [...displayStore.teams].sort((left, right) => right.rating - left.rating);
  const currentRank = team ? rankedTeams.findIndex((entry) => entry.id === team.id) + 1 : null;
  const upcomingTournament =
    historyTournaments.find((tournament) => tournament.status !== "completed") ?? null;
  const profileDisciplineSlug =
    upcomingTournament?.disciplineSlug ??
    historyTournaments[0]?.disciplineSlug ??
    currentUser.disciplines[0] ??
    "mobile-legends";
  const profileDesign =
    disciplineDesigns[profileDisciplineSlug] ?? disciplineDesigns["mobile-legends"];

  const stats = [
    {
      label: copy.rating,
      value: team ? String(team.rating) : "—",
      tone: "gold",
    },
    {
      label: copy.tournaments,
      value: String(historyTournaments.length),
      tone: "violet",
    },
    {
      label: copy.currentRank,
      value: currentRank ? `#${currentRank}` : "—",
      tone: "mint",
    },
    {
      label: copy.joined,
      value: formatDate(currentUser.createdAt, locale),
      tone: "neutral",
    },
  ];

  const activityEntries = sortByDate<ActivityEntry>([
    {
      id: `account-${currentUser.id}`,
      title: copy.activityAccountCreated,
      body: `${currentUser.nickname} ${copy.activityJoined}`,
      isoDate: currentUser.createdAt,
    },
    ...(team
      ? [
          {
            id: `team-${team.id}`,
            title: copy.activityTeamActive,
            body: `${team.name} • ${team.memberIds.length} ${copy.membersLabel}`,
            isoDate: team.createdAt,
            href: `/teams/${team.id}`,
          },
        ]
      : []),
    ...historyTournaments.map((tournament) => ({
      id: `history-${tournament.id}`,
      title: tournament.title,
      body:
        tournament.status === "completed"
          ? copy.tournamentCompleted
          : `${copy.status}: ${formatTournamentStatus(tournament.status, locale)}`,
      isoDate: tournament.startsAt,
      href: `/tournaments/${tournament.id}`,
    })),
  ]).slice(0, 4);

  const accountSnapshot = [
    {
      title: copy.email,
      body: currentUser.email,
      tag: copy.account,
    },
    {
      title: copy.country,
      body: formatCountry(currentUser.country, locale),
      tag: copy.region,
    },
    {
      title: copy.disciplines,
      body:
        currentUser.disciplines.length > 0
          ? currentUser.disciplines
              .map(
                (slug) =>
                  displayStore.disciplines.find((discipline) => discipline.slug === slug)?.shortTitle ??
                  slug,
              )
              .join(", ")
          : copy.notSelected,
      tag: copy.games,
    },
    {
      title: copy.role,
      body: formatUserRole(currentUser.role, locale),
      tag: copy.access,
    },
  ];

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-dashboard-shell">
        <ProfileDashboardSidebar
          activePath="/profile"
          currentUser={currentUser}
          dashboardLabel={copy.dashboard}
          profileLabel={dict.common.profile}
          myTournamentsLabel={copy.myTournaments}
          manageTeamLabel={copy.manageTeam}
          leaveTeamLabel={copy.leaveTeam}
          logOutLabel={dict.header.actions.logOut}
          hasTeam={Boolean(team)}
        />

        <div className="clutch-dashboard-main">
          {needsDisciplineSelection ? (
            <section className="clutch-dashboard-card clutch-profile-setup">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.completeGamesEyebrow}</p>
                  <h2>{copy.completeGamesTitle}</h2>
                </div>
              </div>

              <p className="clutch-profile-setup__copy">{copy.completeGamesCopy}</p>

              <form action={updateProfileDisciplinesAction} className="clutch-detail-form">
                <input type="hidden" name="returnTo" value="/profile" />

                <div className="clutch-profile-game-grid">
                  {displayStore.disciplines.map((discipline) => (
                    <label key={discipline.slug} className="clutch-profile-game-option">
                      <input type="checkbox" name="disciplines" value={discipline.slug} />
                      <span className="clutch-profile-game-option__icon" aria-hidden>
                        {discipline.icon}
                      </span>
                      <span className="clutch-profile-game-option__body">
                        <strong>{discipline.shortTitle}</strong>
                        <span>{discipline.description}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="clutch-profile-setup__actions">
                  <button type="submit" className="clutch-action-button">
                    {copy.completeGamesSubmit}
                  </button>
                  <p>{copy.completeGamesHint}</p>
                </div>
              </form>
            </section>
          ) : null}

          <section className="clutch-profile-hero">
            <div className="clutch-profile-hero__cover">
              <Image
                src={profileDesign.art}
                alt=""
                fill
                sizes="(min-width: 1280px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="clutch-profile-hero__content">
              <div className="clutch-profile-hero__user">
                <span className="clutch-profile-hero__avatar">
                  {currentUser.nickname.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h1>{currentUser.nickname}</h1>
                  <p>{formatCountry(currentUser.country, locale)} • {team?.name ?? copy.freeAgent}</p>
                </div>
              </div>

              <div className="clutch-profile-hero__mini-stats">
                <article>
                  <span>{copy.currentRank}</span>
                  <strong>{currentRank ? `#${currentRank}` : "—"}</strong>
                </article>
                <article>
                  <span>{copy.seasonRating}</span>
                  <strong>{team?.rating ?? "—"}</strong>
                </article>
                <article>
                  <span>{copy.role}</span>
                  <strong>{formatUserRole(currentUser.role, locale)}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="clutch-dashboard-stats">
            {stats.map((card) => (
              <article key={card.label} className={`clutch-dashboard-stat clutch-dashboard-stat--${card.tone}`}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          <section className="clutch-dashboard-grid">
            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.upcomingMatch}</p>
                  <h2>{upcomingTournament?.title ?? copy.noScheduledMatch}</h2>
                </div>
                <Link
                  href={upcomingTournament ? `/tournaments/${upcomingTournament.id}` : "/tournaments"}
                  className="clutch-table-link"
                >
                  {copy.open}
                </Link>
              </div>

              <div className="clutch-upcoming-match">
                <div>
                  <span>{copy.start}</span>
                  <strong>{upcomingTournament ? formatDate(upcomingTournament.startsAt, locale) : "—"}</strong>
                </div>
                <div>
                  <span>{copy.format}</span>
                  <strong>{upcomingTournament?.format ?? "—"}</strong>
                </div>
                <div>
                  <span>{copy.status}</span>
                  <strong>
                    {upcomingTournament
                      ? formatTournamentStatus(upcomingTournament.status, locale)
                      : copy.noActiveTournaments}
                  </strong>
                </div>
              </div>
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.myTournaments}</p>
                  <h2>{copy.activeRuns}</h2>
                </div>
                <Link href="/profile/tournaments" className="clutch-table-link">
                  {copy.seeAll}
                </Link>
              </div>

              {historyTournaments.length > 0 ? (
                <div className="clutch-dashboard-list">
                  {historyTournaments.map((tournament) => (
                    <article key={tournament.id} className="clutch-dashboard-list__item">
                      <div>
                        <strong>{tournament.title}</strong>
                        <span>{formatDate(tournament.startsAt, locale)}</span>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                        {copy.open}
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="clutch-empty-panel">
                  {copy.noHistory}
                </div>
              )}
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.recentActivity}</p>
                  <h2>{copy.timeline}</h2>
                </div>
              </div>

              <div className="clutch-dashboard-list">
                {activityEntries.map((entry) => (
                  <article key={entry.id} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.body}</span>
                    </div>
                    {entry.href ? (
                      <Link href={entry.href} className="clutch-dashboard-list__date">
                        {formatDate(entry.isoDate, locale)}
                      </Link>
                    ) : (
                      <span className="clutch-dashboard-list__date">{formatDate(entry.isoDate, locale)}</span>
                    )}
                  </article>
                ))}
              </div>
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.accountSnapshot}</p>
                  <h2>{copy.details}</h2>
                </div>
              </div>

              <div className="clutch-dashboard-news">
                {accountSnapshot.map((entry) => (
                  <article key={entry.title} className="clutch-dashboard-news__item">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.body}</span>
                    </div>
                    <em>{entry.tag}</em>
                  </article>
                ))}
              </div>
            </article>
          </section>

          {createdTournaments.length > 0 ? (
            <section className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.organizerView}</p>
                  <h2>{copy.createdTournaments}</h2>
                </div>
                <Link href="/admin" className="clutch-table-link">
                  {copy.panel}
                </Link>
              </div>

              <div className="clutch-dashboard-list">
                {createdTournaments.map((tournament) => (
                  <article key={tournament.id} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{tournament.title}</strong>
                      <span>{formatDate(tournament.startsAt, locale)}</span>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                      {copy.open}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
