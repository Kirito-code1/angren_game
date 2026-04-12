import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveTeamAction, removeTeamMemberAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { disciplineDesigns, getDisplayStore, getPromoStore } from "@/lib/design-data";
import { formatCountry, formatDate } from "@/lib/format";
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
  const currentUser = await getCurrentUser();
  const preferredStore = getDisplayStore(store);
  const fallbackPromoStore = getPromoStore(store.disciplines);
  const team =
    getTeamById(preferredStore, id) ?? getTeamById(fallbackPromoStore, id);

  if (!team) {
    notFound();
  }

  const isPromoTeam = team.id.startsWith("promo-");
  const displayStore =
    isPromoTeam || !getTeamById(preferredStore, id) ? fallbackPromoStore : preferredStore;
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
                {formatCountry(team.country)} • {captain?.nickname ?? "Team captain"}
              </p>
            </div>
          </div>

          <div className="clutch-profile-hero__mini-stats">
            <article>
              <span>Rating</span>
              <strong>{team.rating}</strong>
            </article>
            <article>
              <span>Win rate</span>
              <strong>{formatPercent(winRate)}</strong>
            </article>
            <article>
              <span>Members</span>
              <strong>{members.length}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="clutch-dashboard-stats">
        <article className="clutch-dashboard-stat clutch-dashboard-stat--gold">
          <span>Wins</span>
          <strong>{team.wins}</strong>
        </article>
        <article className="clutch-dashboard-stat clutch-dashboard-stat--violet">
          <span>Losses</span>
          <strong>{team.losses}</strong>
        </article>
        <article className="clutch-dashboard-stat clutch-dashboard-stat--mint">
          <span>Tournaments</span>
          <strong>{tournamentHistory.length}</strong>
        </article>
        <article className="clutch-dashboard-stat">
          <span>Established</span>
          <strong>{formatDate(team.createdAt)}</strong>
        </article>
      </section>

      <section className="clutch-detail-layout">
        <div className="clutch-detail-main">
          <article className="clutch-dashboard-card">
            <div className="clutch-dashboard-card__header">
              <div>
                <p className="clutch-page__eyebrow">Roster</p>
                <h2>Active Members</h2>
              </div>
              <span>{members.length} players</span>
            </div>

            <div className="clutch-detail-list">
              {members.map((member) => {
                const canRemove =
                  isCaptain &&
                  member.id !== currentUser?.id &&
                  !isPromoTeam;
                const memberHistory = member.tournamentHistory
                  .map((tournamentId) => getTournamentById(displayStore, tournamentId))
                  .filter((tournament): tournament is NonNullable<typeof tournament> => Boolean(tournament));

                return (
                  <article key={member.id} className="clutch-detail-list__item">
                    <div>
                      <strong>{member.nickname}</strong>
                      <span>
                        {formatCountry(member.country)} • {member.role}
                      </span>
                      <span>{memberHistory.length} events played</span>
                    </div>

                    {canRemove ? (
                      <form action={removeTeamMemberAction}>
                        <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
                        <input type="hidden" name="teamId" value={team.id} />
                        <input type="hidden" name="memberId" value={member.id} />
                        <button type="submit" className="clutch-table-link">
                          Remove
                        </button>
                      </form>
                    ) : (
                      <span className="clutch-table-link">
                        {member.id === captain?.id ? "Captain" : "Member"}
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
                <p className="clutch-page__eyebrow">History</p>
                <h2>Tournament Runs</h2>
              </div>
              <Link href="/tournaments" className="clutch-table-link">
                All tournaments
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
                          {formatDate(tournament.startsAt)} • {creator?.nickname ?? "Organizer"}
                        </span>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                        Open
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="clutch-empty-panel">
                Команда еще не заявлялась в турниры. Следующий экран уже готов принимать историю.
              </div>
            )}
          </article>
        </div>

        <aside className="clutch-detail-aside">
          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Control</p>
                <h2>Team Actions</h2>
              </div>
            </div>

            <div className="clutch-rules-list">
              <article className="clutch-rules-list__item">
                Captain: {captain?.nickname ?? "Not assigned"}
              </article>
              <article className="clutch-rules-list__item">
                Next match: {upcomingRun ? formatDate(upcomingRun.startsAt) : "No active match"}
              </article>
              <article className="clutch-rules-list__item">
                Completed cups: {completedRuns.length}
              </article>
            </div>

            <div className="clutch-organizer-note">
              <strong>
                {isCaptain
                  ? "У вас есть доступ к управлению составом."
                  : isMember
                    ? "Вы в составе этой команды."
                    : "Это публичный профиль команды."}
              </strong>
              <p>
                {isPromoTeam
                  ? "Эта карточка работает как дизайнерский демо-экран, поэтому изменения состава здесь отключены."
                  : "Используйте страницу как центральную точку для состава, истории турниров и быстрых действий."}
              </p>
            </div>

            {isMember && !isPromoTeam ? (
              <form action={leaveTeamAction} className="mt-4">
                <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
                <button type="submit" className="button-secondary w-full">
                  Leave Team
                </button>
              </form>
            ) : (
              <Link href="/teams" className="clutch-action-button mt-4 w-full">
                Back to Leaderboard
              </Link>
            )}
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">Team spotlight</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {upcomingRun?.title ?? `${team.name} Season`}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>{team.rating} pts</strong>
              <span>{discipline?.shortTitle ?? "Tournament roster"}</span>
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
