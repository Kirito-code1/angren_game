import Link from "next/link";
import { notFound } from "next/navigation";
import {
  claimTournamentAction,
  deleteTournamentAction,
  registerTeamToTournamentAction,
  sendTournamentChatMessageAction,
  saveMatchResultAction,
  updateTournamentAction,
} from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { FlashMessage } from "@/components/flash-message";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser } from "@/lib/auth";
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
  const tournament = getTournamentById(store, id);

  if (!tournament) {
    notFound();
  }

  const discipline = getDisciplineBySlug(store, tournament.disciplineSlug);
  const userTeam = currentUser?.teamId ? getTeamById(store, currentUser.teamId) : null;
  const creator = tournament.creatorUserId ? getUserById(store, tournament.creatorUserId) : null;
  const userCanManageTournament =
    currentUser ? canManageTournament(currentUser, tournament) : false;
  const chatMessages = [...tournament.chatMessages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  const canApplyAsCaptain =
    currentUser &&
    userTeam &&
    userTeam.captainId === currentUser.id &&
    tournament.status === "registration_open" &&
    !tournament.appliedTeamIds.includes(userTeam.id) &&
    !tournament.approvedTeamIds.includes(userTeam.id);

  const registeredCount = tournament.appliedTeamIds.length + tournament.approvedTeamIds.length;

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <p className="eyebrow">{discipline?.shortTitle ?? tournament.disciplineSlug}</p>
                <h1 className="section-heading">{tournament.title}</h1>
                <p className="section-copy">
                  На этой странице собраны дата старта, правила, список команд и турнирная сетка.
                </p>
              </div>
              <StatusPill status={tournament.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="hero-note">
                <strong>Старт</strong>
                {formatDate(tournament.startsAt)}
              </article>
              <article className="hero-note">
                <strong>Призовой</strong>
                {formatPrizePool(tournament.prizePoolUSD)}
              </article>
              <article className="hero-note">
                <strong>Формат</strong>
                {tournament.format}
              </article>
              <article className="hero-note">
                <strong>Слоты</strong>
                {registeredCount} / {tournament.teamLimit}
              </article>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="surface-tag">
                Автор: {creator?.nickname ?? "не указан"}
              </span>
              {userCanManageTournament ? (
                <span className="surface-tag">Вы управляете этим турниром</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {userCanManageTournament ? (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="glass-panel p-5 sm:p-6">
            <div className="space-y-2">
              <p className="eyebrow">Управление</p>
              <h2 className="section-heading panel-heading">Редактировать турнир</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4f4f49]">
              Можно обновить название, дату, призовой фонд, лимит команд и правила. Игра не
              меняется после первых заявок, а формат блокируется после генерации сетки.
            </p>

            <form action={updateTournamentAction} className="mt-6 grid gap-3 text-sm">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />

              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Название турнира</span>
                <input name="title" required minLength={4} maxLength={80} defaultValue={tournament.title} />
              </label>

              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Игра</span>
                <select name="disciplineSlug" required defaultValue={tournament.disciplineSlug}>
                  {store.disciplines.map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.shortTitle}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-semibold text-slate-600">Дата и время</span>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    required
                    defaultValue={formatDateTimeLocalValue(tournament.startsAt)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-semibold text-slate-600">Призовой фонд (USD)</span>
                  <input
                    type="number"
                    name="prizePoolUSD"
                    min={0}
                    max={100000}
                    required
                    defaultValue={tournament.prizePoolUSD}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-semibold text-slate-600">Формат</span>
                  <input
                    name="format"
                    required
                    defaultValue={tournament.format}
                    placeholder={discipline?.formats.join(" / ") ?? "5v5 / squad / solo"}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-semibold text-slate-600">Лимит команд</span>
                  <input
                    type="number"
                    name="teamLimit"
                    min={2}
                    max={64}
                    required
                    defaultValue={tournament.teamLimit}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Правила</span>
                <textarea name="rules" defaultValue={tournament.rules.join("\n")} />
              </label>

              <div className="info-card">
                <p className="info-card-label">Что важно</p>
                <p className="mt-2 text-sm leading-7 text-[#4f4f49]">
                  Сейчас зарегистрировано команд: {registeredCount}. Подтверждено:{" "}
                  {tournament.approvedTeamIds.length}. Раундов в сетке: {tournament.bracket.length}.
                </p>
              </div>

              <AuthSubmitButton
                idleLabel="Сохранить изменения"
                pendingLabel="Сохраняем..."
              />
            </form>
          </article>

          <article className="soft-panel p-5 sm:p-6">
            <div className="space-y-2">
              <p className="eyebrow">Удаление</p>
              <h2 className="section-heading panel-heading">Удалить турнир</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4f4f49]">
              Если удалить турнир, исчезнут его страница, чат, заявки и сетка матчей. Действие
              нельзя отменить.
            </p>

            <div className="mt-6 space-y-3">
              <article className="info-card">
                <p className="info-card-label">Текущий турнир</p>
                <p className="info-card-value">{tournament.title}</p>
              </article>
              <article className="info-card">
                <p className="info-card-label">Статус</p>
                <p className="info-card-value">
                  {tournament.status === "registration_open"
                    ? "Регистрация открыта"
                    : tournament.status === "ongoing"
                      ? "Идёт турнир"
                      : "Завершён"}
                </p>
              </article>
            </div>

            <form action={deleteTournamentAction} className="mt-6">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="successTo" value="/admin" />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button type="submit" className="button-danger w-full">
                Удалить турнир
              </button>
            </form>

            <Link href="/admin" className="text-link mt-4">
              Вернуться в панель турниров
            </Link>
          </article>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Правила</p>
            <h2 className="section-heading">Правила турнира</h2>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            {tournament.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Заявка</p>
            <h2 className="section-heading">Регистрация команды</h2>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            Подать заявку можно только с аккаунта, который управляет командой, во время открытой
            регистрации.
          </p>

          {!currentUser ? (
            <Link href="/login" className="button-primary mt-6">
              Войти для регистрации
            </Link>
          ) : canApplyAsCaptain && userTeam ? (
            <form action={registerTeamToTournamentAction} className="mt-6">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <input type="hidden" name="teamId" value={userTeam.id} />
              <button type="submit" className="button-primary w-full">
                Подать заявку ({userTeam.name})
              </button>
            </form>
          ) : (
            <div className="empty-state mt-6">
              {tournament.status !== "registration_open"
                ? "Регистрация закрыта."
                : "У вас нет команды с доступом к подаче заявки."}
            </div>
          )}

          <div className="info-card mt-6">
            <p className="info-card-label">Организатор турнира</p>
            <p className="mt-2 text-sm leading-6 text-[#4f4f49]">
              {creator
                ? `${creator.nickname} отвечает за этот турнир и может подтвердить заявки, запустить сетку и обновить результаты.`
                : "Организатор этого турнира пока не указан."}
            </p>
          </div>

          {!creator && currentUser ? (
            <form action={claimTournamentAction} className="mt-4">
              <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button type="submit" className="button-secondary w-full">
                Это мой турнир
              </button>
            </form>
          ) : null}
        </article>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">00</span>
            <div className="space-y-2">
              <p className="eyebrow">Чат</p>
              <h2 className="section-heading">Связь с организатором</h2>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="glass-panel p-5 sm:p-6">
            {chatMessages.length > 0 ? (
              <div className="space-y-3">
                {chatMessages.map((entry) => {
                  const author = getUserById(store, entry.authorUserId);
                  const isCreatorMessage = creator?.id === entry.authorUserId;
                  const isOwnMessage = currentUser?.id === entry.authorUserId;

                  return (
                    <article key={entry.id} className="info-card">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#171717]">
                            {author?.nickname ?? "Пользователь"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#77776f]">
                            {isCreatorMessage ? "Организатор" : isOwnMessage ? "Вы" : "Участник"}
                          </p>
                        </div>
                        <p className="text-xs text-[#77776f]">{formatDate(entry.createdAt)}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#4f4f49]">{entry.body}</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                Пока нет сообщений. Если у вас есть вопрос по турниру, можно написать здесь.
              </div>
            )}
          </article>

          <article className="soft-panel p-5 sm:p-6">
            <div className="space-y-2">
              <p className="eyebrow">Новое сообщение</p>
              <h2 className="section-heading">Написать в чат</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4f4f49]">
              Сообщения увидят участники турнира и его организатор.
            </p>

            {currentUser ? (
              <form action={sendTournamentChatMessageAction} className="mt-6 grid gap-3">
                <input type="hidden" name="returnTo" value={`/tournaments/${tournament.id}`} />
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <textarea
                  name="body"
                  required
                  minLength={2}
                  maxLength={600}
                  placeholder="Напишите вопрос по регистрации, времени старта или правилам турнира"
                />
                <AuthSubmitButton
                  idleLabel="Отправить сообщение"
                  pendingLabel="Отправляем..."
                />
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="empty-state">Чтобы написать в чат, нужно войти в аккаунт.</div>
                <Link href="/login" className="button-primary">
                  Войти
                </Link>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">Ожидают решения</p>
              <h2 className="section-heading">Поданные заявки</h2>
            </div>
          </div>
        </div>

        {tournament.appliedTeamIds.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tournament.appliedTeamIds.map((teamId) => {
              const team = getTeamById(store, teamId);
              if (!team) {
                return null;
              }

              return (
                <article key={team.id} className="info-card">
                  <p className="font-heading text-xl uppercase leading-none text-[#10204c]">
                    {team.name}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">Рейтинг: {team.rating}</p>
                  <p className="mt-2 text-sm font-semibold text-[#9a6708]">
                    Ожидает подтверждения
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Пока нет новых заявок.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">02</span>
            <div className="space-y-2">
              <p className="eyebrow">Участники</p>
              <h2 className="section-heading">Подтверждённые команды</h2>
            </div>
          </div>
        </div>

        {tournament.approvedTeamIds.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tournament.approvedTeamIds.map((teamId) => {
              const team = getTeamById(store, teamId);
              if (!team) {
                return null;
              }

              return (
                <article key={team.id} className="info-card">
                  <p className="font-heading text-xl uppercase leading-none text-[#10204c]">
                    {team.name}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">Рейтинг: {team.rating}</p>
                  <Link href={`/teams/${team.id}`} className="text-link mt-4">
                    Профиль команды
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Подтверждённых команд пока нет.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">03</span>
            <div className="space-y-2">
              <p className="eyebrow">Матчи</p>
              <h2 className="section-heading">Турнирная сетка и результаты</h2>
            </div>
          </div>
        </div>

        {tournament.bracket.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {tournament.bracket.map((round) => (
              <article key={round.id} className="glass-panel space-y-4 p-5 sm:p-6">
                <h3 className="font-heading text-2xl uppercase leading-none text-[#10204c]">
                  {round.title}
                </h3>
                {round.matches.map((match) => {
                  const teamA = match.teamAId ? getTeamById(store, match.teamAId) : null;
                  const teamB = match.teamBId ? getTeamById(store, match.teamBId) : null;

                  return (
                    <div key={match.id} className="info-card text-sm">
                      <p className="font-semibold text-[#10204c]">
                        {teamA?.name ?? "TBD"} vs {teamB?.name ?? "TBD"}
                      </p>
                      <p className="mt-2 text-slate-600">Счёт: {match.score}</p>
                      <p className="mt-1 text-slate-600">
                        Статус: {match.status === "finished" ? "завершён" : "ожидается"}
                      </p>

                      {userCanManageTournament &&
                      match.status !== "finished" &&
                      match.teamAId &&
                      match.teamBId ? (
                        <form
                          action={saveMatchResultAction}
                          className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          <input
                            type="hidden"
                            name="returnTo"
                            value={`/tournaments/${tournament.id}`}
                          />
                          <input type="hidden" name="tournamentId" value={tournament.id} />
                          <input type="hidden" name="roundId" value={round.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <input name="scoreA" type="number" min={0} required placeholder="Счёт A" />
                          <input name="scoreB" type="number" min={0} required placeholder="Счёт B" />
                          <button type="submit" className="button-secondary">
                            Сохранить
                          </button>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Сетка появится после подтверждения команд и запуска матчей организатором.
          </div>
        )}
      </section>
    </div>
  );
}
