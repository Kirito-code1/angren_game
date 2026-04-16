import Link from "next/link";
import { FlashMessage } from "@/components/flash-message";
import { ProfileDashboardSidebar } from "@/components/profile-dashboard-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getDisplayStore } from "@/lib/design-data";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatTournamentStatus } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamById, getTournamentById, matchesUserIdentifier } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProfileTournamentsPage({
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
            <p className="clutch-page__eyebrow">{copy.myTournaments}</p>
            <h1 className="clutch-page__title">{copy.myTournaments}</h1>
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
  const historyTournamentIds = new Set(historyTournaments.map((tournament) => tournament.id));
  const createdTournaments = displayStore.tournaments.filter((tournament) =>
    matchesUserIdentifier(currentUser, tournament.creatorUserId) && !historyTournamentIds.has(tournament.id),
  );
  const myTournaments = [...historyTournaments].sort(
    (left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
  );
  const myCreatedTournaments = [...createdTournaments].sort(
    (left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
  );

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-dashboard-shell">
        <ProfileDashboardSidebar
          activePath="/profile/tournaments"
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
          <section className="clutch-dashboard-card">
            <div className="clutch-dashboard-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.myTournaments}</p>
                <h1 className="clutch-page__title">{copy.myTournaments}</h1>
              </div>
              <span className="surface-tag">
                {myTournaments.length} {copy.tournaments}
              </span>
            </div>

            {myTournaments.length > 0 ? (
              <div className="clutch-dashboard-list">
                {myTournaments.map((tournament) => (
                  <article key={tournament.id} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{tournament.title}</strong>
                      <span>
                        {formatDate(tournament.startsAt, locale)} •{" "}
                        {formatTournamentStatus(tournament.status, locale)}
                      </span>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                      {copy.open}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="clutch-empty-panel">{copy.noHistory}</div>
            )}
          </section>

          {myCreatedTournaments.length > 0 ? (
            <section className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.organizerView}</p>
                  <h2>{copy.createdTournaments}</h2>
                </div>
              </div>

              <div className="clutch-dashboard-list">
                {myCreatedTournaments.map((tournament) => (
                  <article key={tournament.id} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{tournament.title}</strong>
                      <span>
                        {formatDate(tournament.startsAt, locale)} •{" "}
                        {formatTournamentStatus(tournament.status, locale)}
                      </span>
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
