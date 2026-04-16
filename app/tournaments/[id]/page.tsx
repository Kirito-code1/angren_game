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
} from "@/lib/design-data";
import { getI18n } from "@/lib/i18n-server";
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
  const { locale, dict } = await getI18n();
  const copy = dict.tournamentDetail;
  const currentUser = await getCurrentUser();
  const displayStore = getDisplayStore(store);
  const tournament = getTournamentById(displayStore, id);

  if (!tournament) {
    notFound();
  }

  const discipline = getDisciplineBySlug(displayStore, tournament.disciplineSlug);
  const creator = tournament.creatorUserId
    ? getUserById(displayStore, tournament.creatorUserId)
    : null;
  const userTeam = currentUser?.teamId ? getTeamById(displayStore, currentUser.teamId) : null;
  const userCanManageTournament = currentUser ? canManageTournament(currentUser, tournament) : false;
  const canApplyAsCaptain =
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
              <StatusPill status={tournament.status} locale={locale} />
            </div>

            <div className="space-y-3">
              <p className="clutch-page__eyebrow">{copy.back}</p>
              <h1 className="clutch-detail-banner__title">{tournament.title}</h1>
              <p className="clutch-detail-banner__copy">{copy.body}</p>
            </div>

            <div className="clutch-detail-banner__actions">
              <a href="#bracket" className="clutch-action-button">
                {copy.viewBracket}
              </a>
              <a href="#registration" className="clutch-ghost-button">
                {copy.registration}
              </a>
            </div>
          </div>
        </article>

        <aside className="clutch-detail-sidecard">
          <div className="clutch-detail-sidecard__stats">
            <article>
              <span>{copy.prize}</span>
              <strong>{formatPrizePool(tournament.prizePoolUSD, locale)}</strong>
            </article>
            <article>
              <span>{copy.slots}</span>
              <strong>
                {registeredCount}/{tournament.teamLimit}
              </strong>
            </article>
            <article>
              <span>{copy.start}</span>
              <strong>{formatDate(tournament.startsAt, locale)}</strong>
            </article>
            <article>
              <span>{copy.mode}</span>
              <strong>{tournament.format}</strong>
            </article>
          </div>

          <div className="clutch-detail-sidecard__organizer">
            <p>{copy.organizer}</p>
            <strong>{creator?.nickname ?? copy.organizerUnassigned}</strong>
            <span>{discipline?.shortTitle ?? tournament.disciplineSlug}</span>
          </div>

          <div className="clutch-detail-sidecard__summary">
            <span>{appliedTeams.length} {copy.pendingTeams}</span>
            <span>{approvedTeams.length} {copy.approvedTeams}</span>
          </div>
        </aside>
      </section>

      <div className="clutch-tabs">
        <span className="is-active">{copy.overview}</span>
        <span>{copy.participants}</span>
        <span>{copy.bracket}</span>
        <span>{copy.rules}</span>
      </div>

      <section className="clutch-detail-layout">
        <div className="clutch-detail-main">
          <article id="bracket" className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.bracket}</p>
                <h2>{copy.battleElimination}</h2>
              </div>
              <span>{tournament.bracket.length > 0 ? `${tournament.bracket.length} ${copy.rounds}` : copy.awaitingLaunch}</span>
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
                                <span>{match.teamAId ? copy.teamA : copy.pending}</span>
                              </div>
                              <div>
                                <strong>{teamB?.name ?? "TBD"}</strong>
                                <span>{match.teamBId ? copy.teamB : copy.pending}</span>
                              </div>
                            </div>

                            <div className="clutch-match-card__score">
                              <span>{match.status === "finished" ? copy.finished : copy.scheduled}</span>
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
                                  {dict.common.save}
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
                {copy.bracketEmpty}
              </div>
            )}
          </article>

          <div className="clutch-detail-columns">
            <article className="clutch-detail-card">
              <div className="clutch-detail-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.approvedLineup}</p>
                  <h2>{copy.lineup}</h2>
                </div>
              </div>

              <div className="clutch-detail-list">
                {approvedTeams.length > 0 ? (
                  approvedTeams.map((team) => (
                    <article key={team.id} className="clutch-detail-list__item">
                      <div>
                        <strong>{team.name}</strong>
                        <span>{team.rating}</span>
                      </div>
                      <Link href={`/teams/${team.id}`} className="clutch-table-link">
                        {dict.common.open}
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="clutch-empty-panel">{copy.noApproved}</div>
                )}
              </div>
            </article>

            <article className="clutch-detail-card">
              <div className="clutch-detail-card__header">
                <div>
                  <p className="clutch-page__eyebrow">{copy.pendingRegistrations}</p>
                  <h2>{copy.applicants}</h2>
                </div>
              </div>

              <div className="clutch-detail-list">
                {appliedTeams.length > 0 ? (
                  appliedTeams.map((team) => (
                    <article key={team.id} className="clutch-detail-list__item">
                      <div>
                        <strong>{team.name}</strong>
                        <span>{team.rating}</span>
                      </div>
                      <span className="clutch-table-link">{dict.common.pending}</span>
                    </article>
                  ))
                ) : (
                  <div className="clutch-empty-panel">{copy.noPending}</div>
                )}
              </div>
            </article>
          </div>
        </div>

        <aside className="clutch-detail-aside">
          <article id="registration" className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.registerTitle}</p>
                <h2>{copy.joinEvent}</h2>
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
                  <strong>{copy.startDate}</strong>
                  <span>{formatDate(tournament.startsAt, locale)}</span>
                </div>
              </article>
              <article className="clutch-detail-list__item">
                <div>
                  <strong>{dict.common.prizePool}</strong>
                  <span>{formatPrizePool(tournament.prizePoolUSD, locale)}</span>
                </div>
              </article>
              <article className="clutch-detail-list__item">
                <div>
                  <strong>{copy.slotsMeta}</strong>
                  <span>
                    {registeredCount}/{tournament.teamLimit}
                  </span>
                </div>
              </article>
            </div>

            {!currentUser ? (
              <Link href="/login" className="clutch-action-button w-full">
                {copy.logInToRegister}
              </Link>
            ) : canApplyAsCaptain && userTeam ? (
              <form action={registerTeamToTournamentAction}>
                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <input type="hidden" name="teamId" value={userTeam.id} />
                <button type="submit" className="clutch-action-button w-full">
                  {copy.registerTeam} {userTeam.name}
                </button>
              </form>
            ) : (
              <div className="clutch-empty-panel">
                {tournament.status !== "registration_open"
                  ? copy.registrationClosed
                  : copy.captainOnly}
              </div>
            )}

            {!creator && currentUser ? (
              <form action={claimTournamentAction}>
                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <button type="submit" className="clutch-ghost-button w-full">
                  {copy.claimTournament}
                </button>
              </form>
            ) : null}
          </article>

          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.tournamentRules}</p>
                <h2>{copy.rulesOverview}</h2>
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
              <strong>{copy.organizerMessage}</strong>
              <p>
                {creator
                  ? `${creator.nickname} manages approvals, schedule changes, and final results.`
                  : copy.organizerFallback}
              </p>
            </div>
          </article>
        </aside>
      </section>

      <section className="clutch-detail-chat">
        <article className="clutch-detail-card">
          <div className="clutch-detail-card__header">
            <div>
              <p className="clutch-page__eyebrow">{copy.chat}</p>
              <h2>{copy.conversation}</h2>
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
                      <span>{formatDate(entry.createdAt, locale)}</span>
                    </div>
                    <p>{entry.body}</p>
                  </article>
                );
              })
            ) : (
              <div className="clutch-empty-panel">
                {copy.noMessages}
              </div>
            )}
          </div>
        </article>

        <article className="clutch-detail-card">
          <div className="clutch-detail-card__header">
            <div>
              <p className="clutch-page__eyebrow">{copy.sendMessage}</p>
              <h2>{copy.contactOrganizer}</h2>
            </div>
          </div>

          {currentUser ? (
            <form action={sendTournamentChatMessageAction} className="clutch-detail-form">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={600}
                placeholder={copy.chatPlaceholder}
              />
              <AuthSubmitButton idleLabel={copy.send} pendingLabel={copy.sending} />
            </form>
          ) : (
            <Link href="/login" className="clutch-action-button w-full">
              {copy.logIn}
            </Link>
          )}
        </article>
      </section>

      {userCanManageTournament ? (
        <section className="clutch-management-grid">
          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.organizerControls}</p>
                <h2>{copy.editTournament}</h2>
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
              <AuthSubmitButton idleLabel={dict.common.save} pendingLabel={copy.sending} />
            </form>
          </article>

          <article className="clutch-detail-card">
            <div className="clutch-detail-card__header">
              <div>
                <p className="clutch-page__eyebrow">{copy.deleteTournament}</p>
                <h2>{copy.deleteTournament}</h2>
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
                {copy.delete}
              </button>
            </form>
          </article>
        </section>
      ) : null}
    </div>
  );
}
