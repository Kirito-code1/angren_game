import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveTeamAction, removeTeamMemberAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { getI18n } from "@/lib/i18n-server";
import { formatCountry, formatDate, formatUserRole } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import {
  getTeamById,
  getTeamCaptain,
  getTeamMembers,
  getTournamentById,
  getUserById,
} from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);

  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.teamDetail;
  const currentUser = await getCurrentUser();
  const displayStore = getDisplayStore(store);
  const team = getTeamById(displayStore, id);

  if (!team) {
    notFound();
  }

  const members = getTeamMembers(displayStore, team);
  const captain = getTeamCaptain(displayStore, team);
  const isCaptain = currentUser?.id === team.captainId;
  const isMember = currentUser ? team.memberIds.includes(currentUser.id) : false;

  const tournamentHistory = displayStore.tournaments.filter(
    (tournament) =>
      tournament.appliedTeamIds.includes(team.id) ||
      tournament.approvedTeamIds.includes(team.id),
  );
  const completedRuns = tournamentHistory.filter((tournament) => tournament.status === "completed");
  const upcomingRun =
    tournamentHistory.find((tournament) => tournament.status !== "completed") ?? null;
  const totalMatches = Math.max(team.wins + team.losses, 1);
  const winRate = (team.wins / totalMatches) * 100;
  const firstTournament = tournamentHistory[0] ?? null;
  const discipline = firstTournament
    ? displayStore.disciplines.find((entry) => entry.slug === firstTournament.disciplineSlug) ?? null
    : displayStore.disciplines[0] ?? null;
  const design =
    (discipline ? disciplineDesigns[discipline.slug] : null) ??
    disciplineDesigns["pubg-mobile"];

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-profile-hero">
        <div className="clutch-profile-hero__cover">
          <Image
            src={design.art}
            alt={`Artwork for ${team.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="clutch-profile-hero__content">
          <div className="clutch-profile-hero__user">
            <span className="clutch-profile-hero__avatar">{team.logo}</span>
            <div>
              <h1>{team.name}</h1>
              <p>
                {formatCountry(team.country, locale)} • {captain?.nickname ?? copy.captainFallback}
              </p>
            </div>
          </div>

          <div className="clutch-profile-hero__mini-stats">
            <article>
              <span>{copy.rating}</span>
              <strong>{team.rating}</strong>
            </article>
            <article>
              <span>{copy.winRate}</span>
              <strong>{formatPercent(winRate)}</strong>
            </article>
            <article>
              <span>{copy.members}</span>
              <strong>{members.length}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="clutch-dashboard-stats">
        <article className="clutch-dashboard-stat clutch-dashboard-stat--gold">
          <span>{copy.wins}</span>
          <strong>{team.wins}</strong>
        </article>
        <article className="clutch-dashboard-stat clutch-dashboard-stat--violet">
          <span>{copy.losses}</span>
          <strong>{team.losses}</strong>
        </article>
        <article className="clutch-dashboard-stat clutch-dashboard-stat--mint">
          <span>{copy.tournaments}</span>
          <strong>{tournamentHistory.length}</strong>
        </article>
        <article className="clutch-dashboard-stat">
          <span>{copy.established}</span>
          <strong>{formatDate(team.createdAt, locale)}</strong>
        </article>
      </section>

      <section className="clutch-detail-layout">
        <div className="clutch-detail-main">
          <article className="clutch-dashboard-card">
            <div className="clutch-dashboard-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.roster}</p>
                <h2>{copy.activeMembers}</h2>
              </div>
              <span>{members.length} {copy.players}</span>
            </div>

            <div className="clutch-detail-list">
              {members.map((member) => {
                const canRemove = isCaptain && member.id !== currentUser?.id;
                const memberHistory = member.tournamentHistory
                  .map((tournamentId) => getTournamentById(displayStore, tournamentId))
                  .filter((tournament): tournament is NonNullable<typeof tournament> => Boolean(tournament));

                return (
                  <article key={member.id} className="clutch-detail-list__item">
                    <div>
                      <strong>{member.nickname}</strong>
                      <span>
                        {formatCountry(member.country, locale)} • {formatUserRole(member.role, locale)}
                      </span>
                      <span>{memberHistory.length} {copy.eventsPlayed}</span>
                    </div>

                    {canRemove ? (
                      <form action={removeTeamMemberAction}>
                        <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
                        <input type="hidden" name="teamId" value={team.id} />
                        <input type="hidden" name="memberId" value={member.id} />
                        <button type="submit" className="clutch-table-link">
                          {dict.common.remove}
                        </button>
                      </form>
                    ) : (
                      <span className="clutch-table-link">
                        {member.id === captain?.id ? dict.common.captain : dict.common.member}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          </article>

          <article className="clutch-dashboard-card">
            <div className="clutch-dashboard-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.history}</p>
                <h2>{copy.tournamentRuns}</h2>
              </div>
              <Link href="/tournaments" className="clutch-table-link">
                {copy.allTournaments}
              </Link>
            </div>

            {tournamentHistory.length > 0 ? (
              <div className="clutch-dashboard-list">
                {tournamentHistory.map((tournament) => {
                  const creator = tournament.creatorUserId
                    ? getUserById(displayStore, tournament.creatorUserId)
                    : null;

                  return (
                    <article key={tournament.id} className="clutch-dashboard-list__item">
                      <div>
                        <strong>{tournament.title}</strong>
                        <span>
                          {formatDate(tournament.startsAt, locale)} • {creator?.nickname ?? copy.captain}
                        </span>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                        {dict.common.open}
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="clutch-empty-panel">
                {copy.noHistory}
              </div>
            )}
          </article>
        </div>

        <aside className="clutch-detail-aside">
          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.control}</p>
                <h2>{copy.teamActions}</h2>
              </div>
            </div>

            <div className="clutch-rules-list">
              <article className="clutch-rules-list__item">
                {copy.captain}: {captain?.nickname ?? copy.notAssigned}
              </article>
              <article className="clutch-rules-list__item">
                {copy.nextMatch}: {upcomingRun ? formatDate(upcomingRun.startsAt, locale) : copy.noMatch}
              </article>
              <article className="clutch-rules-list__item">
                {copy.completedCups}: {completedRuns.length}
              </article>
            </div>

            <div className="clutch-organizer-note">
              <strong>
                {isCaptain
                  ? copy.captainAccess
                  : isMember
                    ? copy.memberAccess
                    : copy.publicAccess}
              </strong>
              <p>{copy.helperCopy}</p>
            </div>

            {isMember ? (
              <form action={leaveTeamAction} className="mt-4">
                <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
                <button type="submit" className="button-secondary w-full">
                  {copy.leaveTeam}
                </button>
              </form>
            ) : (
              <Link href="/teams" className="clutch-action-button mt-4 w-full">
                {copy.backToLeaderboard}
              </Link>
            )}
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">{copy.spotlight}</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {upcomingRun?.title ?? `${team.name} ${copy.season}`}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>{team.rating}</strong>
              <span>{discipline?.shortTitle ?? copy.tournamentRoster}</span>
            </div>

            <div className="clutch-sidebar-card__promo-art">
              <Image
                src={design.art}
                alt={`Spotlight artwork for ${team.name}`}
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
