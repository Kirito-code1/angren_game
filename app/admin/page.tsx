import Link from "next/link";
import {
  createTournamentAction,
  deleteTournamentAction,
  generateBracketAction,
  reviewTeamRegistrationAction,
} from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
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
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <FlashMessage message={message} />
        <section className="hero-banner">
          <p className="eyebrow">Турниры</p>
          <h1 className="section-heading">Создание турнира</h1>
          <p className="section-copy">
            Для создания турнира нужно войти в аккаунт.
          </p>
          <Link href="/login" className="button-secondary mt-4">
            Войти
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
            <p className="eyebrow">Турниры</p>
            <h1 className="section-heading">Панель турниров</h1>
            <p className="section-copy">
              {isOrganizer
                ? "Здесь можно создавать новые турниры и управлять всеми турнирами на сайте."
                : "Здесь можно создавать новые турниры и управлять своими турнирами."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="hero-note">
              <strong>{isOrganizer ? "Всего турниров" : "Ваши турниры"}</strong>
              {manageableTournaments.length}
            </article>
            <article className="hero-note">
              <strong>Открыта регистрация</strong>
              {manageableTournaments.filter((tournament) => tournament.status === "registration_open").length}
            </article>
            <article className="hero-note">
              <strong>Ваш доступ</strong>
              {isOrganizer ? "Организатор" : "Пользователь"}
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Новый турнир</p>
            <h2 className="section-heading panel-heading">Создать турнир</h2>
          </div>

          <form action={createTournamentAction} className="mt-6 grid gap-3 text-sm">
            <input type="hidden" name="returnTo" value="/admin" />
            <label className="grid gap-2">
              <span className="font-semibold text-slate-600">Название турнира</span>
              <input name="title" required placeholder="Summer Cup CA 2026" />
            </label>

            <label className="grid gap-2">
              <span className="font-semibold text-slate-600">Дисциплина</span>
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
                <span className="font-semibold text-slate-600">Дата и время</span>
                <input type="datetime-local" name="startsAt" required />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Призовой фонд (USD)</span>
                <input type="number" name="prizePoolUSD" min={0} required placeholder="5000" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Формат</span>
                <input name="format" required placeholder="5v5 / squad / solo" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Лимит команд</span>
                <input type="number" name="teamLimit" min={2} required placeholder="16" />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="font-semibold text-slate-600">Правила (каждое с новой строки)</span>
              <textarea name="rules" placeholder={"Возраст 16+\nCheck-in за 30 минут"} />
            </label>

            <button type="submit" className="button-primary w-full sm:w-fit">
              Создать турнир
            </button>
          </form>
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Заявки</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? "Заявки на подтверждение" : "Заявки по вашим турнирам"}
            </h2>
          </div>

          {tournamentsWithApplications.length > 0 ? (
            <div className="mt-6 space-y-3">
              {tournamentsWithApplications.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold text-[#10204c]">{tournament.title}</p>
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
                          <p className="text-sm font-semibold text-[#10204c]">{team.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Рейтинг: {team.rating}</p>
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
                                Подтвердить
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
                                Отклонить
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
              {isOrganizer
                ? "Нет заявок, ожидающих подтверждения."
                : "По вашим турнирам пока нет заявок."}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Сетка матчей</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? "Генерация сетки" : "Сетка по вашим турнирам"}
            </h2>
          </div>

          {tournamentsReadyForBracket.length > 0 ? (
            <div className="mt-6 space-y-3">
              {tournamentsReadyForBracket.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold text-[#10204c]">{tournament.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Подтверждено команд: {tournament.approvedTeamIds.length}
                  </p>
                  <form action={generateBracketAction} className="mt-4">
                    <input type="hidden" name="returnTo" value="/admin" />
                    <input type="hidden" name="tournamentId" value={tournament.id} />
                    <button type="submit" className="button-secondary">
                      Сгенерировать сетку
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-6">Нет турниров, готовых к генерации сетки.</div>
          )}
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Текущие турниры</p>
            <h2 className="section-heading panel-heading">
              {isOrganizer ? "Текущие турниры" : "Ваши активные турниры"}
            </h2>
          </div>

          {ongoingTournaments.length > 0 ? (
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {ongoingTournaments.map((tournament) => (
                <article key={tournament.id} className="info-card">
                  <p className="font-semibold text-[#10204c]">{tournament.title}</p>
                  <p className="mt-1 text-slate-600">Старт: {formatDate(tournament.startsAt)}</p>
                  <Link href={`/tournaments/${tournament.id}`} className="text-link mt-4">
                    Открыть и внести результат
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-6">Сейчас нет активных турниров.</div>
          )}
        </article>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">MY</span>
            <div className="space-y-2">
              <p className="eyebrow">Управление</p>
              <h2 className="section-heading panel-heading">
                {isOrganizer ? "Все турниры" : "Ваши турниры"}
              </h2>
            </div>
          </div>
        </div>

        {manageableTournaments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {manageableTournaments.map((tournament) => {
              const totalTeams =
                tournament.appliedTeamIds.length + tournament.approvedTeamIds.length;
              const statusLabel =
                tournament.status === "registration_open"
                  ? "Регистрация открыта"
                  : tournament.status === "ongoing"
                    ? "Идёт турнир"
                    : "Завершён";

              return (
                <article key={tournament.id} className="glass-panel p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10204c]">{tournament.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Старт: {formatDate(tournament.startsAt)}
                      </p>
                    </div>
                    <span className="surface-tag">{statusLabel}</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <article className="hero-note">
                      <strong>Заявок</strong>
                      {totalTeams}
                    </article>
                    <article className="hero-note">
                      <strong>Подтверждено</strong>
                      {tournament.approvedTeamIds.length}
                    </article>
                    <article className="hero-note">
                      <strong>Раундов</strong>
                      {tournament.bracket.length}
                    </article>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/tournaments/${tournament.id}`} className="button-secondary">
                      Открыть и изменить
                    </Link>
                    <form action={deleteTournamentAction}>
                      <input type="hidden" name="returnTo" value="/admin" />
                      <input type="hidden" name="successTo" value="/admin" />
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <button type="submit" className="button-danger">
                        Удалить
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Пока нет турниров, которыми вы можете управлять.</div>
        )}
      </section>
    </div>
  );
}
