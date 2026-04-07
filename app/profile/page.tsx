import Link from "next/link";
import { leaveTeamAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { formatCountry, formatDate } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamById, getTournamentById, matchesUserIdentifier } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProfilePage({
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
          <p className="eyebrow">Профиль</p>
          <h1 className="section-heading">Профиль</h1>
          <p className="section-copy">Войдите, чтобы просматривать и редактировать данные профиля.</p>
          <Link href="/login" className="button-secondary mt-4">
            Перейти ко входу
          </Link>
        </section>
      </div>
    );
  }

  const team = currentUser.teamId ? getTeamById(store, currentUser.teamId) : null;
  const createdTournaments = store.tournaments.filter(
    (tournament) => matchesUserIdentifier(currentUser, tournament.creatorUserId),
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="eyebrow">Мой профиль</p>
              <h1 className="section-heading">{currentUser.nickname}</h1>
              <p className="section-copy">
                Здесь собраны данные игрока, команда и история участия в турнирах.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-[#e4e4de] bg-[#f4f4f2] px-3 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#171717]">
              Личный кабинет
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="hero-note">
              <strong>Страна</strong>
              {formatCountry(currentUser.country)}
            </article>
            <article className="hero-note lg:col-span-2">
              <strong>Дисциплины</strong>
              {currentUser.disciplines.join(", ")}
            </article>
            <article className="hero-note">
              <strong>История</strong>
              {currentUser.tournamentHistory.length} турниров
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Команда</p>
            <h2 className="section-heading">Моя команда</h2>
          </div>
          {team ? (
            <div className="mt-6 space-y-4 text-sm text-[#5a5a54]">
              <p className="font-heading text-3xl uppercase leading-none text-[#171717]">
                {team.name}
              </p>
              <p>
                Рейтинг {team.rating} • Статистика {team.wins}W/{team.losses}L
              </p>
              <Link href={`/teams/${team.id}`} className="text-link">
                Открыть страницу команды
              </Link>
              <form action={leaveTeamAction}>
                <input type="hidden" name="returnTo" value="/profile" />
                <button
                  type="submit"
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Покинуть команду
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-sm text-[#5a5a54]">
              <p>Вы пока не состоите в команде.</p>
              <Link href="/teams" className="button-primary">
                Создать или выбрать команду
              </Link>
            </div>
          )}
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Аккаунт</p>
            <h2 className="section-heading">Безопасность</h2>
          </div>
          <p className="mt-6 text-sm text-[#5a5a54]">Email: {currentUser.email}</p>
          <p className="mt-3 text-sm leading-7 text-[#5a5a54]">
            Здесь хранятся данные аккаунта, которые используются для входа, участия в турнирах и
            работы с командой.
          </p>
        </article>
      </section>

      <section className="glass-panel p-5 sm:p-6">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">Турниры</p>
              <h2 className="section-heading">История участия</h2>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {currentUser.tournamentHistory.length > 0 ? (
            currentUser.tournamentHistory.map((tournamentId) => {
              const tournament = getTournamentById(store, tournamentId);

              return (
                <article key={tournamentId} className="info-card text-sm">
                  <p className="font-semibold text-[#171717]">{tournament?.title ?? tournamentId}</p>
                  <p className="mt-2 text-[#5a5a54]">Статус: {tournament?.status ?? "unknown"}</p>
                  {tournament ? (
                    <Link href={`/tournaments/${tournament.id}`} className="text-link mt-4">
                      Перейти к турниру
                    </Link>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="empty-state md:col-span-2">Пока нет записей в истории турниров.</div>
          )}
        </div>
      </section>

      <section className="glass-panel p-5 sm:p-6">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">02</span>
            <div className="space-y-2">
              <p className="eyebrow">Мои турниры</p>
              <h2 className="section-heading">Созданные турниры</h2>
            </div>
          </div>
          <Link href="/admin" className="text-link">
            Панель турниров
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {createdTournaments.length > 0 ? (
            createdTournaments.map((tournament) => (
              <article key={tournament.id} className="info-card text-sm">
                <p className="font-semibold text-[#171717]">{tournament.title}</p>
                <p className="mt-2 text-[#5a5a54]">Статус: {tournament.status}</p>
                <p className="mt-1 text-[#5a5a54]">Старт: {formatDate(tournament.startsAt)}</p>
                <Link href={`/tournaments/${tournament.id}`} className="text-link mt-4">
                  Открыть турнир
                </Link>
              </article>
            ))
          ) : (
            <div className="empty-state md:col-span-2">
              Вы пока не видите созданных турниров. Если турнир уже есть на сайте, откройте его
              страницу и нажмите «Это мой турнир».
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
