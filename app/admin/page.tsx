import Link from "next/link";
import {
  createTournamentAction,
  deleteTournamentAction,
  generateBracketAction,
  reviewTeamRegistrationAction,
} from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, formatTournamentStatus } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamById, matchesUserIdentifier } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const { locale, dict } = await getI18n();
  const copy = dict.admin;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <FlashMessage message={message} />
        <section className="hero-banner">
          <p className="eyebrow">{copy.tournaments}</p>
          <h1 className="section-heading">{copy.createTitle}</h1>
          <p className="section-copy">{copy.loginRequired}</p>
          <Link href="/login" className="button-secondary mt-4">
            {dict.common.logIn}
          </Link>
        </section>
      </div>
    );
  }
  const isOrganizer = currentUser.role === "organizer";
  const manageableTournaments = isOrganizer
    ? store.tournaments
    : store.tournaments.filter((tournament) =>
        matchesUserIdentifier(currentUser, tournament.creatorUserId),
      );

  const tournamentsWithApplications = manageableTournaments.filter(
    (tournament) => tournament.appliedTeamIds.length > 0,
  );

  const tournamentsReadyForBracket = manageableTournaments.filter(
    (tournament) =>
      tournament.approvedTeamIds.length >= 2 &&
      tournament.bracket.length === 0 &&
      tournament.status !== "completed",
  );

  const ongoingTournaments = manageableTournaments.filter(
    (tournament) => tournament.status === "ongoing",
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="eyebrow">{copy.tournaments}</p>
            <h1 className="section-heading">{copy.panelTitle}</h1>
            <p className="section-copy">{isOrganizer ? copy.organizerCopy : copy.userCopy}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="hero-note">
              <strong>{isOrganizer ? copy.totalTournaments : copy.yourTournaments}</strong>
              {manageableTournaments.length}
            </article>
            <article className="hero-note">
              <strong>{copy.registrationOpen}</strong>
              {manageableTournaments.filter((tournament) => tournament.status === "registration_open").length}
            </article>
            <article className="hero-note">
              <strong>{copy.access}</strong>
              {isOrganizer ? copy.organizer : copy.user}
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">{copy.newTournament}</p>
            <h2 className="section-heading panel-heading">{copy.createTournament}</h2>
          </div>

          <form action={createTournamentAction} className="mt-6 grid gap-3 text-sm">
            <input type="hidden" name="returnTo" value="/admin" />
            <label className="grid gap-2">
              <span className="font-semibold">{copy.titleLabel}</span>
              <input name="title" required placeholder={copy.titlePlaceholder} />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold">{copy.discipline}</span>
              <select name="disciplineSlug" required defaultValue={store.disciplines[0]?.slug}>
                {store.disciplines.map((discipline) => (
                  <option key={discipline.slug} value={discipline.slug}>
                    {discipline.shortTitle}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="font-semibold">{copy.startsAt}</span>
                <input type="datetime-local" name="startsAt" required />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold">{copy.prizePool}</span>
                <input type="number" name="prizePoolUSD" min={0} required placeholder={copy.prizePlaceholder} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="font-semibold">{copy.format}</span>
                <input name="format" required placeholder={copy.formatPlaceholder} />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold">{copy.teamLimit}</span>
                <input type="number" name="teamLimit" min={2} required placeholder={copy.teamLimitPlaceholder} />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="font-semibold">{copy.rules}</span>
              <textarea name="rules" placeholder={copy.rulesPlaceholder} />
            </label>

            <button type="submit" className="button-primary w-full sm:w-fit">
              {copy.createTournament}
            </button>
          </form>
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">{copy.applications}</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? copy.organizerApplications : copy.userApplications}
            </h2>
          </div>

          {tournamentsWithApplications.length > 0 ? (
            <div className="mt-6 space-y-3">
              {tournamentsWithApplications.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold">{tournament.title}</p>
                  <div className="mt-4 space-y-3">
                    {tournament.appliedTeamIds.map((teamId) => {
                      const team = getTeamById(store, teamId);
                      if (!team) {
                        return null;
                      }

                      return (
                        <div
                          key={team.id}
                          className="rounded-[1.2rem] border border-slate-200 bg-white p-4"
                        >
                          <p className="text-sm font-semibold">{team.name}</p>
                          <p className="mt-1 text-xs">{copy.rating}: {team.rating}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <form action={reviewTeamRegistrationAction}>
                              <input type="hidden" name="returnTo" value="/admin" />
                              <input type="hidden" name="tournamentId" value={tournament.id} />
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="decision" value="approve" />
                              <button
                                type="submit"
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700"
                              >
                                {copy.approve}
                              </button>
                            </form>

                            <form action={reviewTeamRegistrationAction}>
                              <input type="hidden" name="returnTo" value="/admin" />
                              <input type="hidden" name="tournamentId" value={tournament.id} />
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="decision" value="reject" />
                              <button
                                type="submit"
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-rose-700"
                              >
                                {copy.reject}
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-6">
              {isOrganizer ? copy.noOrganizerApplications : copy.noUserApplications}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">{copy.bracket}</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? copy.organizerBracket : copy.userBracket}
            </h2>
          </div>

          {tournamentsReadyForBracket.length > 0 ? (
            <div className="mt-6 space-y-3">
              {tournamentsReadyForBracket.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold">{tournament.title}</p>
                  <p className="mt-1 text-xs">
                    {copy.confirmedTeams}: {tournament.approvedTeamIds.length}
                  </p>
                  <form action={generateBracketAction} className="mt-4">
                    <input type="hidden" name="returnTo" value="/admin" />
                    <input type="hidden" name="tournamentId" value={tournament.id} />
                    <button type="submit" className="button-secondary">
                      {copy.generateBracket}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-6">{copy.noBracketReady}</div>
          )}
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">{copy.ongoing}</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? copy.organizerOngoing : copy.userOngoing}
            </h2>
          </div>

          {ongoingTournaments.length > 0 ? (
            <div className="mt-6 space-y-3 text-sm">
              {ongoingTournaments.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold">{tournament.title}</p>
                  <p className="mt-1">{copy.start}: {formatDate(tournament.startsAt, locale)}</p>
                  <Link href={`/tournaments/${tournament.id}`} className="text-link mt-4">
                    {copy.openAndReport}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-6">{copy.noOngoing}</div>
          )}
        </article>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">CZ</span>
            <div className="space-y-2">
              <p className="eyebrow">{copy.management}</p>
              <h2 className="section-heading panel-heading">
                {isOrganizer ? copy.allTournaments : copy.yourTournaments}
              </h2>
            </div>
          </div>
        </div>

        {manageableTournaments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {manageableTournaments.map((tournament) => {
              const totalTeams =
                tournament.appliedTeamIds.length + tournament.approvedTeamIds.length;
              const statusLabel = formatTournamentStatus(tournament.status, locale);

              return (
                <article key={tournament.id} className="glass-panel p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{tournament.title}</p>
                      <p className="mt-1 text-sm">
                        {copy.start}: {formatDate(tournament.startsAt, locale)}
                      </p>
                    </div>
                    <span className="surface-tag">{statusLabel}</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <article className="hero-note">
                      <strong>{copy.applicationsCount}</strong>
                      {totalTeams}
                    </article>
                    <article className="hero-note">
                      <strong>{copy.approved}</strong>
                      {tournament.approvedTeamIds.length}
                    </article>
                    <article className="hero-note">
                      <strong>{copy.rounds}</strong>
                      {tournament.bracket.length}
                    </article>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/tournaments/${tournament.id}`} className="button-secondary">
                      {copy.openAndEdit}
                    </Link>
                    <form action={deleteTournamentAction}>
                      <input type="hidden" name="returnTo" value="/admin" />
                      <input type="hidden" name="successTo" value="/admin" />
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <button type="submit" className="button-danger">
                        {copy.delete}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">{copy.noManageable}</div>
        )}
      </section>
    </div>
  );
}
