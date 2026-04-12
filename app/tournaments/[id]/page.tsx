import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  claimTournamentAction,
  deleteTournamentAction,
  registerTeamToTournamentAction,
  saveMatchResultAction,
  sendTournamentChatMessageAction,
  updateTournamentAction,
} from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { FlashMessage } from "@/components/flash-message";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser } from "@/lib/auth";
import {
  disciplineDesigns,
  getDisplayStore,
  getPromoStore,
  isStoreInPromoMode,
} from "@/lib/design-data";
import { formatDate, formatDateTimeLocalValue, formatPrizePool } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import {
  canManageTournament,
  getDisciplineBySlug,
  getTeamById,
  getTournamentById,
  getUserById,
} from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TournamentPage({
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
  const promoMode = isStoreInPromoMode(store);
  const preferredStore = getDisplayStore(store);
  const fallbackPromoStore = getPromoStore(store.disciplines);
  const tournament =
    getTournamentById(preferredStore, id) ?? getTournamentById(fallbackPromoStore, id);

  if (!tournament) {
    notFound();
  }

  const isPromoTournament = tournament.id.startsWith("promo-");
  const displayStore =
    isPromoTournament || !getTournamentById(preferredStore, id)
      ? fallbackPromoStore
      : preferredStore;

  const discipline = getDisciplineBySlug(displayStore, tournament.disciplineSlug);
  const creator = tournament.creatorUserId
    ? getUserById(displayStore, tournament.creatorUserId)
    : null;
  const userTeam = currentUser?.teamId ? getTeamById(displayStore, currentUser.teamId) : null;
  const userCanManageTournament =
    !promoMode && !isPromoTournament && currentUser
      ? canManageTournament(currentUser, tournament)
      : false;
  const canApplyAsCaptain =
    !promoMode &&
    !isPromoTournament &&
    currentUser &&
    userTeam &&
    userTeam.captainId === currentUser.id &&
    tournament.status === "registration_open" &&
    !tournament.appliedTeamIds.includes(userTeam.id) &&
    !tournament.approvedTeamIds.includes(userTeam.id);

  const registeredCount = tournament.appliedTeamIds.length + tournament.approvedTeamIds.length;
  const chatMessages = [...tournament.chatMessages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const design = disciplineDesigns[tournament.disciplineSlug] ?? disciplineDesigns["pubg-mobile"];
  const approvedTeams = tournament.approvedTeamIds
    .map((teamId) => getTeamById(displayStore, teamId))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));
  const appliedTeams = tournament.appliedTeamIds
    .map((teamId) => getTeamById(displayStore, teamId))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-detail-hero">
        <article className="clutch-detail-banner">
          <div className="clutch-detail-banner__media">
            <Image
              src={design.art}
              alt={`Artwork for ${tournament.title}`}
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
              <StatusPill status={tournament.status} />
            </div>

            <div className="space-y-3">
              <p className="clutch-page__eyebrow">Back to Tournaments</p>
              <h1 className="clutch-detail-banner__title">{tournament.title}</h1>
              <p className="clutch-detail-banner__copy">
                {promoMode
                  || isPromoTournament
                  ? "Демонстрационный экран турнира по макету: баннер, правая статистика, сетка, участники и чат."
                  : "Откройте баннер, основную сетку и блок участников на одной странице без переключения по разным разделам."}
              </p>
            </div>

            <div className="clutch-detail-banner__actions">
              <a href="#bracket" className="clutch-action-button">
                View Bracket
              </a>
              <a href="#registration" className="clutch-ghost-button">
                Registration
              </a>
            </div>
          </div>
        </article>

        <aside className="clutch-detail-sidecard">
          <div className="clutch-detail-sidecard__stats">
            <article>
              <span>Prize</span>
              <strong>{formatPrizePool(tournament.prizePoolUSD)}</strong>
            </article>
            <article>
              <span>Slots</span>
              <strong>
                {registeredCount}/{tournament.teamLimit}
              </strong>
            </article>
            <article>
              <span>Start</span>
              <strong>{formatDate(tournament.startsAt)}</strong>
            </article>
            <article>
              <span>Mode</span>
              <strong>{tournament.format}</strong>
            </article>
          </div>

          <div className="clutch-detail-sidecard__organizer">
            <p>Organizer</p>
            <strong>{creator?.nickname ?? "ZoneAdmin"}</strong>
            <span>{discipline?.shortTitle ?? tournament.disciplineSlug}</span>
          </div>

          <div className="clutch-detail-sidecard__summary">
            <span>{appliedTeams.length} pending teams</span>
            <span>{approvedTeams.length} approved</span>
          </div>
        </aside>
      </section>

      <div className="clutch-tabs">
        <span className="is-active">Overview</span>
        <span>Participants</span>
        <span>Bracket</span>
        <span>Rules</span>
      </div>

      <section className="clutch-detail-layout">
        <div className="clutch-detail-main">
          <article id="bracket" className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Tournament Bracket</p>
                <h2>Battle Elimination</h2>
              </div>
              <span>{tournament.bracket.length > 0 ? `${tournament.bracket.length} rounds` : "awaiting launch"}</span>
            </div>

            {tournament.bracket.length > 0 ? (
              <div className="clutch-bracket-board">
                {tournament.bracket.map((round) => (
                  <div key={round.id} className="clutch-bracket-column">
                    <h3>{round.title}</h3>
                    <div className="clutch-bracket-column__matches">
                      {round.matches.map((match) => {
                        const teamA = match.teamAId ? getTeamById(displayStore, match.teamAId) : null;
                        const teamB = match.teamBId ? getTeamById(displayStore, match.teamBId) : null;

                        return (
                          <article key={match.id} className="clutch-match-card">
                            <div className="clutch-match-card__teams">
                              <div>
                                <strong>{teamA?.name ?? "TBD"}</strong>
                                <span>{match.teamAId ? "Team A" : "Pending"}</span>
                              </div>
                              <div>
                                <strong>{teamB?.name ?? "TBD"}</strong>
                                <span>{match.teamBId ? "Team B" : "Pending"}</span>
                              </div>
                            </div>

                            <div className="clutch-match-card__score">
                              <span>{match.status === "finished" ? "Finished" : "Scheduled"}</span>
                              <strong>{match.score}</strong>
                            </div>

                            {userCanManageTournament &&
                            match.status !== "finished" &&
                            match.teamAId &&
                            match.teamBId ? (
                              <form action={saveMatchResultAction} className="clutch-inline-form">
                                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                                <input type="hidden" name="tournamentId" value={tournament.id} />
                                <input type="hidden" name="roundId" value={round.id} />
                                <input type="hidden" name="matchId" value={match.id} />
                                <input name="scoreA" type="number" min={0} required placeholder="A" />
                                <input name="scoreB" type="number" min={0} required placeholder="B" />
                                <button type="submit" className="clutch-table-link">
                                  Save
                                </button>
                              </form>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="clutch-empty-panel">
                The bracket will appear after enough teams are approved and the organizer launches the tournament.
              </div>
            )}
          </article>

          <div className="clutch-detail-columns">
            <article className="clutch-detail-card">
              <div className="clutch-detail-card__header">
                <div>
                  <p className="clutch-page__eyebrow">Approved Teams</p>
                  <h2>Lineup</h2>
                </div>
              </div>

              <div className="clutch-detail-list">
                {approvedTeams.length > 0 ? (
                  approvedTeams.map((team) => (
                    <article key={team.id} className="clutch-detail-list__item">
                      <div>
                        <strong>{team.name}</strong>
                        <span>{team.rating} pts</span>
                      </div>
                      <Link href={`/teams/${team.id}`} className="clutch-table-link">
                        View
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="clutch-empty-panel">No approved teams yet.</div>
                )}
              </div>
            </article>

            <article className="clutch-detail-card">
              <div className="clutch-detail-card__header">
                <div>
                  <p className="clutch-page__eyebrow">Pending Registrations</p>
                  <h2>Applicants</h2>
                </div>
              </div>

              <div className="clutch-detail-list">
                {appliedTeams.length > 0 ? (
                  appliedTeams.map((team) => (
                    <article key={team.id} className="clutch-detail-list__item">
                      <div>
                        <strong>{team.name}</strong>
                        <span>{team.rating} pts</span>
                      </div>
                      <span className="clutch-table-link">Pending</span>
                    </article>
                  ))
                ) : (
                  <div className="clutch-empty-panel">No pending applications right now.</div>
                )}
              </div>
            </article>
          </div>
        </div>

        <aside className="clutch-detail-aside">
          <article id="registration" className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Register For Tournament</p>
                <h2>Join Event</h2>
              </div>
            </div>

            <div className="clutch-registration-poster">
              <div className="clutch-registration-poster__media">
                <Image
                  src={design.art}
                  alt={`Poster for ${tournament.title}`}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <div className="clutch-registration-poster__overlay" />
              <div className="clutch-registration-poster__content">
                <span className={`landing-chip ${design.badgeClass}`}>{discipline?.shortTitle ?? design.label}</span>
                <strong>{tournament.title}</strong>
              </div>
            </div>

            <div className="clutch-detail-list clutch-detail-list--meta">
              <article className="clutch-detail-list__item">
                <div>
                  <strong>Start Date</strong>
                  <span>{formatDate(tournament.startsAt)}</span>
                </div>
              </article>
              <article className="clutch-detail-list__item">
                <div>
                  <strong>Prize Pool</strong>
                  <span>{formatPrizePool(tournament.prizePoolUSD)}</span>
                </div>
              </article>
              <article className="clutch-detail-list__item">
                <div>
                  <strong>Slots</strong>
                  <span>
                    {registeredCount}/{tournament.teamLimit}
                  </span>
                </div>
              </article>
            </div>

            {promoMode || isPromoTournament ? (
              <div className="clutch-empty-panel">
                Demo mode: registration form is shown as a design preview. Real registration becomes active when your own tournaments and teams exist.
              </div>
            ) : !currentUser ? (
              <Link href="/login" className="clutch-action-button w-full">
                Log In To Register
              </Link>
            ) : canApplyAsCaptain && userTeam ? (
              <form action={registerTeamToTournamentAction}>
                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <input type="hidden" name="teamId" value={userTeam.id} />
                <button type="submit" className="clutch-action-button w-full">
                  Register {userTeam.name}
                </button>
              </form>
            ) : (
              <div className="clutch-empty-panel">
                {tournament.status !== "registration_open"
                  ? "Registration is closed."
                  : "Only the captain of an eligible team can apply here."}
              </div>
            )}

            {!creator && currentUser && !promoMode ? (
              <form action={claimTournamentAction}>
                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <button type="submit" className="clutch-ghost-button w-full">
                  Claim Tournament
                </button>
              </form>
            ) : null}
          </article>

          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Tournament Rules</p>
                <h2>Overview</h2>
              </div>
            </div>

            <div className="clutch-rules-list">
              {tournament.rules.map((rule) => (
                <div key={rule} className="clutch-rules-list__item">
                  {rule}
                </div>
              ))}
            </div>

            <div className="clutch-organizer-note">
              <strong>Organizer Message</strong>
              <p>
                {creator
                  ? `${creator.nickname} manages approvals, schedule changes, and final results.`
                  : "Organizer details will appear here after the event is claimed."}
              </p>
            </div>
          </article>
        </aside>
      </section>

      <section className="clutch-detail-chat">
        <article className="clutch-detail-card">
          <div className="clutch-detail-card__header">
            <div>
              <p className="clutch-page__eyebrow">Tournament Chat</p>
              <h2>Conversation</h2>
            </div>
          </div>

          <div className="clutch-chat-stream">
            {chatMessages.length > 0 ? (
              chatMessages.map((entry) => {
                const author = getUserById(displayStore, entry.authorUserId);

                return (
                  <article key={entry.id} className="clutch-chat-message">
                    <div className="clutch-chat-message__meta">
                      <strong>{author?.nickname ?? "Player"}</strong>
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                    <p>{entry.body}</p>
                  </article>
                );
              })
            ) : (
              <div className="clutch-empty-panel">
                No messages yet. Use this panel for schedule questions and tournament updates.
              </div>
            )}
          </div>
        </article>

        <article className="clutch-detail-card">
          <div className="clutch-detail-card__header">
            <div>
              <p className="clutch-page__eyebrow">Send Message</p>
              <h2>Contact Organizer</h2>
            </div>
          </div>

          {promoMode || isPromoTournament ? (
            <div className="clutch-empty-panel">
              Demo mode keeps the chat read-only. The live form will appear here once real users and tournaments are active.
            </div>
          ) : currentUser ? (
            <form action={sendTournamentChatMessageAction} className="clutch-detail-form">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={600}
                placeholder="Ask about rules, check-in time, or lobby details"
              />
              <AuthSubmitButton idleLabel="Send Message" pendingLabel="Sending..." />
            </form>
          ) : (
            <Link href="/login" className="clutch-action-button w-full">
              Log In
            </Link>
          )}
        </article>
      </section>

      {userCanManageTournament ? (
        <section className="clutch-management-grid">
          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Organizer Controls</p>
                <h2>Edit Tournament</h2>
              </div>
            </div>

            <form action={updateTournamentAction} className="clutch-detail-form">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <input name="title" required minLength={4} maxLength={80} defaultValue={tournament.title} />
              <select name="disciplineSlug" required defaultValue={tournament.disciplineSlug}>
                {displayStore.disciplines.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.shortTitle}
                  </option>
                ))}
              </select>
              <div className="clutch-inline-form">
                <input
                  type="datetime-local"
                  name="startsAt"
                  required
                  defaultValue={formatDateTimeLocalValue(tournament.startsAt)}
                />
                <input
                  type="number"
                  name="prizePoolUSD"
                  min={0}
                  max={100000}
                  required
                  defaultValue={tournament.prizePoolUSD}
                />
              </div>
              <div className="clutch-inline-form">
                <input name="format" required defaultValue={tournament.format} />
                <input
                  type="number"
                  name="teamLimit"
                  min={2}
                  max={64}
                  required
                  defaultValue={tournament.teamLimit}
                />
              </div>
              <textarea name="rules" defaultValue={tournament.rules.join("\n")} />
              <AuthSubmitButton idleLabel="Save Changes" pendingLabel="Saving..." />
            </form>
          </article>

          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">Danger Zone</p>
                <h2>Delete Tournament</h2>
              </div>
            </div>

            <p className="clutch-empty-shell__copy">
              Removing the tournament will erase its page, chat, applications, and bracket.
            </p>

            <form action={deleteTournamentAction} className="grid gap-3">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="successTo" value="/admin" />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button type="submit" className="button-danger w-full">
                Delete Tournament
              </button>
            </form>
          </article>
        </section>
      ) : null}
    </div>
  );
}
