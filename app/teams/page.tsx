import Link from "next/link";
import { createTeamAction, joinTeamAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import {
  getDisplayStore,
  getPromoStore,
  isStoreInPromoMode,
  promoCurrentUserId,
} from "@/lib/design-data";
import { getCurrentUser } from "@/lib/auth";
import { countryLabels } from "@/lib/catalog";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamCaptain } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const currentUser = await getCurrentUser();
  const promoMode = isStoreInPromoMode(store);
  const displayStore = getDisplayStore(store);
  const fallbackPromoStore = getPromoStore(store.disciplines);
  const personalRankStore = currentUser ? displayStore : fallbackPromoStore;

  const sortedTeams = [...displayStore.teams].sort((a, b) => b.rating - a.rating);
  const displayUser =
    currentUser ??
    fallbackPromoStore.users.find((user) => user.id === promoCurrentUserId) ??
    null;
  const displayTeam = displayUser?.teamId
    ? personalRankStore.teams.find((team) => team.id === displayUser.teamId) ??
      fallbackPromoStore.teams.find((team) => team.id === displayUser.teamId) ??
      null
    : null;
  const currentRank = displayTeam
    ? [...personalRankStore.teams]
        .sort((a, b) => b.rating - a.rating)
        .findIndex((team) => team.id === displayTeam.id) + 1
    : null;

  const podiumTeams = [
    sortedTeams[1] ?? null,
    sortedTeams[0] ?? null,
    sortedTeams[2] ?? null,
  ];

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-leaderboard-shell">
        <div className="clutch-page__header">
          <div>
            <p className="clutch-page__eyebrow">The best players. The highest score.</p>
            <h1 className="clutch-page__title">Leaderboard</h1>
          </div>

          <div className="clutch-toolbar">
            <span className="clutch-toolbar__pill is-active">Global</span>
            <span className="clutch-toolbar__pill">PUBG</span>
            <span className="clutch-toolbar__pill">Mobile Legends</span>
          </div>
        </div>

        <div className="clutch-leaderboard-layout">
          <div className="clutch-leaderboard-main">
            <div className="clutch-podium">
              {podiumTeams.map((team, index) => {
                if (!team) {
                  return null;
                }

                const teamStore = team.id.startsWith("promo-") ? fallbackPromoStore : displayStore;
                const captain = getTeamCaptain(teamStore, team);
                const visualRank = index === 0 ? 2 : index === 1 ? 1 : 3;

                return (
                  <article
                    key={team.id}
                    className={`clutch-podium-card clutch-podium-card--${visualRank}`}
                  >
                    <span className="clutch-podium-card__place">#{visualRank}</span>
                    <span className="clutch-podium-card__logo">{team.logo}</span>
                    <strong className="clutch-podium-card__name">{team.name}</strong>
                    <span className="clutch-podium-card__score">{team.rating} pts</span>
                    <span className="clutch-podium-card__captain">
                      {captain?.nickname ?? "Captain"}
                    </span>
                  </article>
                );
              })}
            </div>

            <div className="clutch-board-table">
              <div className="clutch-board-table__head">
                <span>Rank</span>
                <span>Squad</span>
                <span>Captain</span>
                <span>Country</span>
                <span>Win rate</span>
              </div>

              {sortedTeams.map((team, index) => {
                const teamStore = team.id.startsWith("promo-") ? fallbackPromoStore : displayStore;
                const captain = getTeamCaptain(teamStore, team);
                const totalMatches = Math.max(team.wins + team.losses, 1);
                const winRate = (team.wins / totalMatches) * 100;
                const canJoin =
                  currentUser &&
                  !currentUser.teamId &&
                  !team.memberIds.includes(currentUser.id) &&
                  !team.id.startsWith("promo-");

                return (
                  <article key={team.id} className="clutch-board-table__row">
                    <span className="clutch-board-table__rank">{index + 1}</span>
                    <div className="clutch-board-table__team">
                      <span className="clutch-board-table__team-logo">{team.logo}</span>
                      <div>
                        <strong>{team.name}</strong>
                        <span>{team.rating} pts</span>
                      </div>
                    </div>
                    <span>{captain?.nickname ?? "—"}</span>
                    <span>{countryLabels[team.country]}</span>
                    <div className="clutch-board-table__metric">
                      <strong>{formatPercent(winRate)}</strong>
                      {canJoin ? (
                        <form action={joinTeamAction}>
                          <input type="hidden" name="returnTo" value="/teams" />
                          <input type="hidden" name="teamId" value={team.id} />
                          <button type="submit" className="clutch-table-link">
                            Join
                          </button>
                        </form>
                      ) : (
                        <Link href={`/teams/${team.id}`} className="clutch-table-link">
                          Profile
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="clutch-leaderboard-side">
            <article className="clutch-rank-panel">
              <p className="clutch-page__eyebrow">Your rank</p>
              <strong className="clutch-rank-panel__value">
                {currentRank ? `#${currentRank}` : promoMode ? "#128" : "—"}
              </strong>
              <span className="clutch-rank-panel__team">
                {displayTeam?.name ?? (promoMode ? "Preview squad" : "No team yet")}
              </span>
              <p className="clutch-rank-panel__copy">
                {currentUser
                  ? "Играйте турниры, чтобы подняться в таблице и открыть следующую лигу."
                  : promoMode
                    ? "Войдите в аккаунт, чтобы видеть реальное место вашей команды."
                    : "Создайте команду или вступите в состав, чтобы попасть в рейтинг."}
              </p>
              <Link href={currentUser ? "/profile" : "/register"} className="clutch-action-button w-full">
                {currentUser ? "Open Profile" : "Sign Up"}
              </Link>
            </article>

            {currentUser && !currentUser.teamId ? (
              <article className="clutch-rank-panel">
                <p className="clutch-page__eyebrow">Create squad</p>
                <form action={createTeamAction} className="grid gap-3">
                  <input type="hidden" name="returnTo" value="/teams" />
                  <input name="name" required placeholder="Angren Falcons" />
                  <input name="logo" maxLength={3} placeholder="AF" />
                  <select name="country" required defaultValue="">
                    <option value="">Выберите страну</option>
                    {Object.entries(countryLabels).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="button-primary w-full">
                    Создать команду
                  </button>
                </form>
              </article>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
