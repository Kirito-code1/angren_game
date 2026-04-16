import Link from "next/link";
import { createTeamAction, joinTeamAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getDisplayStore } from "@/lib/design-data";
import { getCurrentUser } from "@/lib/auth";
import { countryLabels } from "@/lib/catalog";
import { countryLabelsByLocale } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { getMessageFromSearchParams } from "@/lib/messages";
import type { Locale } from "@/lib/ui-preferences";
import { getTeamCaptain } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

function formatPercent(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
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
  const { locale, dict } = await getI18n();
  const copy = dict.teams;
  const displayStore = getDisplayStore(store);
  const countryLabelsForLocale = countryLabelsByLocale[locale];

  const sortedTeams = [...displayStore.teams].sort((left, right) => right.rating - left.rating);
  const displayTeam = currentUser?.teamId
    ? displayStore.teams.find((team) => team.id === currentUser.teamId) ?? null
    : null;
  const currentRank = displayTeam
    ? sortedTeams.findIndex((team) => team.id === displayTeam.id) + 1
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
            <p className="clutch-page__eyebrow">{copy.eyebrow}</p>
            <h1 className="clutch-page__title">{copy.title}</h1>
          </div>

          <div className="clutch-toolbar">
            <span className="clutch-toolbar__pill is-active">{copy.global}</span>
            <span className="clutch-toolbar__pill">PUBG</span>
            <span className="clutch-toolbar__pill">Mobile Legends</span>
          </div>
        </div>

        <div className="clutch-leaderboard-layout">
          <div className="clutch-leaderboard-main">
            {sortedTeams.length > 0 ? (
              <>
                <div className="clutch-podium">
                  {podiumTeams.map((team, index) => {
                    if (!team) {
                      return null;
                    }

                    const captain = getTeamCaptain(displayStore, team);
                    const visualRank = index === 0 ? 2 : index === 1 ? 1 : 3;

                    return (
                      <article
                        key={team.id}
                        className={`clutch-podium-card clutch-podium-card--${visualRank}`}
                      >
                        <span className="clutch-podium-card__place">#{visualRank}</span>
                        <span className="clutch-podium-card__logo">{team.logo}</span>
                        <strong className="clutch-podium-card__name">{team.name}</strong>
                        <span className="clutch-podium-card__score">{team.rating} {copy.points}</span>
                        <span className="clutch-podium-card__captain">
                          {captain?.nickname ?? dict.common.captain}
                        </span>
                      </article>
                    );
                  })}
                </div>

                <div className="clutch-board-table">
                  <div className="clutch-board-table__head">
                    <span>{copy.yourRank}</span>
                    <span>{copy.squad}</span>
                    <span>{dict.common.captain}</span>
                    <span>{copy.countryColumn}</span>
                    <span>{copy.winRate}</span>
                  </div>

                  {sortedTeams.map((team, index) => {
                    const captain = getTeamCaptain(displayStore, team);
                    const totalMatches = Math.max(team.wins + team.losses, 1);
                    const winRate = (team.wins / totalMatches) * 100;
                    const canJoin =
                      currentUser &&
                      !currentUser.teamId &&
                      !team.memberIds.includes(currentUser.id);

                    return (
                      <article key={team.id} className="clutch-board-table__row">
                        <span className="clutch-board-table__rank">{index + 1}</span>
                        <div className="clutch-board-table__team">
                          <span className="clutch-board-table__team-logo">{team.logo}</span>
                          <div>
                            <strong>{team.name}</strong>
                            <span>{team.rating} {copy.points}</span>
                          </div>
                        </div>
                        <span>{captain?.nickname ?? "—"}</span>
                        <span>{countryLabelsForLocale[team.country]}</span>
                        <div className="clutch-board-table__metric">
                          <strong>{formatPercent(winRate, locale)}</strong>
                          {canJoin ? (
                            <form action={joinTeamAction}>
                              <input type="hidden" name="returnTo" value="/teams" />
                              <input type="hidden" name="teamId" value={team.id} />
                              <button type="submit" className="clutch-table-link">
                                {dict.common.join}
                              </button>
                            </form>
                          ) : (
                            <Link href={`/teams/${team.id}`} className="clutch-table-link">
                              {dict.common.profile}
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="clutch-empty-panel">
                {copy.empty}
              </div>
            )}
          </div>

          <aside className="clutch-leaderboard-side">
            <article className="clutch-rank-panel">
              <p className="clutch-page__eyebrow">{copy.yourRank}</p>
              <strong className="clutch-rank-panel__value">
                {currentRank ? `#${currentRank}` : "—"}
              </strong>
              <span className="clutch-rank-panel__team">
                {displayTeam?.name ?? copy.noTeam}
              </span>
              <p className="clutch-rank-panel__copy">
                {currentUser
                  ? displayTeam
                    ? copy.rankCopyWithTeam
                    : copy.rankCopyNoTeam
                  : copy.guestCopy}
              </p>
              <Link href={currentUser ? "/profile" : "/login?mode=register"} className="clutch-action-button w-full">
                {currentUser ? dict.common.profile : dict.common.signUp}
              </Link>
            </article>

            {currentUser && !currentUser.teamId ? (
              <article className="clutch-rank-panel">
                <p className="clutch-page__eyebrow">{copy.createSquad}</p>
                <form action={createTeamAction} className="grid gap-3">
                  <input type="hidden" name="returnTo" value="/teams" />
                  <input name="name" required placeholder={copy.teamNamePlaceholder} />
                  <input name="logo" maxLength={3} placeholder={copy.teamLogoPlaceholder} />
                  <select name="country" required defaultValue="">
                    <option value="">{copy.chooseCountry}</option>
                    {Object.entries(countryLabels).map(([code, label]) => (
                      <option key={code} value={code}>
                        {countryLabelsForLocale[code as keyof typeof countryLabelsForLocale] ?? label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="button-primary w-full">
                    {copy.createTeam}
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
