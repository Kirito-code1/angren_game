import Link from "next/link";
import { FlashMessage } from "@/components/flash-message";
import { TournamentCard } from "@/components/tournament-card";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatPrizePool } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import {
  getTeamCaptain,
  getTopTeams,
  getTournamentsByDiscipline,
  getTournamentsByStatus,
} from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

const quickLinks = [
  {
    title: "Турниры",
    copy: "Актуальные и архивные чемпионаты в одном каталоге.",
    href: "/tournaments",
    action: "Открыть",
  },
  {
    title: "Игры",
    copy: "Ближайшие турниры, форматы и статистика по каждой игре.",
    href: "/games",
    action: "Смотреть",
  },
  {
    title: "Команды",
    copy: "Рейтинг составов, профили и быстрые переходы к участникам.",
    href: "/teams",
    action: "Перейти",
  },
];

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const currentUser = await getCurrentUser();

  const openTournaments = getTournamentsByStatus(store, "registration_open");
  const activeTournaments = getTournamentsByStatus(store, "ongoing");
  const topTeams = getTopTeams(store, 3);
  const allUpcoming = sortByDate([...openTournaments, ...activeTournaments]);
  const featuredTournament = allUpcoming[0] ?? sortByDate(store.tournaments)[0] ?? null;
  const featuredDisciplines = store.disciplines.slice(0, 3).map((discipline) => ({
    discipline,
    tournaments: getTournamentsByDiscipline(store, discipline.slug)
      .filter((tournament) => tournament.status !== "completed")
      .slice(0, 3),
  }));

  const approvedTeamsTotal = store.tournaments.reduce(
    (total, tournament) => total + tournament.approvedTeamIds.length,
    0,
  );
  const finishedMatches = store.tournaments.reduce(
    (total, tournament) =>
      total +
      tournament.bracket.reduce(
        (roundTotal, round) =>
          roundTotal + round.matches.filter((match) => match.status === "finished").length,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="eyebrow">Главная</p>
              <h1 className="section-heading hero-main-title">
                Турниры, команды и матчи в одном месте
              </h1>
              <p className="section-copy">
                Выбирайте турнир, подавайте заявку командой и следите за сеткой матчей без лишних
                шагов.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/tournaments" className="button-primary w-full sm:w-auto">
                Смотреть турниры
              </Link>
              <Link
                href={currentUser ? "/profile" : "/login"}
                className="button-secondary w-full sm:w-auto"
              >
                {currentUser ? "Открыть профиль" : "Войти"}
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {store.disciplines.map((discipline) => (
                <span key={discipline.slug} className="surface-tag">
                  {discipline.shortTitle}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="hero-note">
                <strong>Открытая регистрация</strong>
                {formatCount(openTournaments.length)}
              </article>
              <article className="hero-note">
                <strong>Подтверждённых команд</strong>
                {formatCount(approvedTeamsTotal)}
              </article>
              <article className="hero-note">
                <strong>Завершённых матчей</strong>
                {formatCount(finishedMatches)}
              </article>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <p className="eyebrow">Ближайший турнир</p>
              <h2 className="font-heading text-3xl uppercase leading-none text-[#171717] [overflow-wrap:anywhere]">
                {featuredTournament?.title ?? "Скоро новый турнир"}
              </h2>
              <p className="text-sm leading-7 text-[#5a5a54]">
                {featuredTournament
                  ? "Откройте страницу турнира: дата старта, слоты, призовой фонд и сетка матчей."
                  : "Как только появится новый турнир, он сразу отобразится здесь."}
              </p>
            </div>

            {featuredTournament ? (
              <div className="grid gap-3">
                <div className="info-card">
                  <p className="info-card-label">Старт</p>
                  <p className="info-card-value">{formatDate(featuredTournament.startsAt)}</p>
                </div>
                <div className="info-card">
                  <p className="info-card-label">Призовой фонд</p>
                  <p className="info-card-value">
                    {formatPrizePool(featuredTournament.prizePoolUSD)}
                  </p>
                </div>
                <Link
                  href={`/tournaments/${featuredTournament.id}`}
                  className="button-secondary w-full sm:w-auto"
                >
                  Открыть турнир
                </Link>
              </div>
            ) : (
              <div className="empty-state">Пока нет ближайших турниров.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <article key={item.href} className="glass-panel flex flex-col gap-4">
            <div className="space-y-2">
              <p className="eyebrow">{item.title}</p>
              <h2 className="font-heading text-2xl uppercase leading-none text-[#171717]">
                {item.title}
              </h2>
              <p className="text-sm leading-7 text-[#5a5a54]">{item.copy}</p>
            </div>
            <Link href={item.href} className="text-link mt-auto">
              {item.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
              <span className="section-bar__icon">01</span>
              <div className="space-y-2">
                <p className="eyebrow">Скоро</p>
                <h2 className="section-heading">Ближайшие турниры</h2>
              </div>
            </div>
          <Link href="/tournaments" className="text-link">
            Весь каталог
          </Link>
        </div>

        {allUpcoming.length > 0 ? (
          <div className={allUpcoming.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {allUpcoming.slice(0, 4).map((tournament) => {
              const discipline = store.disciplines.find(
                (entry) => entry.slug === tournament.disciplineSlug,
              );

              return (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  disciplineTitle={discipline?.shortTitle}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Сейчас нет открытых или активных турниров.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
              <span className="section-bar__icon">02</span>
              <div className="space-y-2">
                <p className="eyebrow">Игры</p>
                <h2 className="section-heading">Игры</h2>
              </div>
            </div>
          <Link href="/games" className="text-link">
            Все игры
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {featuredDisciplines.map(({ discipline, tournaments }) => (
            <article key={discipline.slug} className="glass-panel space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="eyebrow">Игра</p>
                  <h3 className="font-heading text-2xl uppercase leading-none text-[#171717]">
                    {discipline.shortTitle}
                  </h3>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#d7d7cf] bg-[#f4f4f2] text-base font-black uppercase tracking-[0.14em] text-[#171717]">
                  {discipline.icon}
                </span>
              </div>

              <p className="text-sm leading-7 text-[#5a5a54]">{discipline.description}</p>

              {tournaments.length > 0 ? (
                <div className="grid gap-3">
                  {tournaments.map((tournament) => (
                    <div key={tournament.id} className="info-card">
                      <p className="font-semibold text-[#171717]">{tournament.title}</p>
                      <p className="mt-2 text-sm text-[#5a5a54]">
                        {formatDate(tournament.startsAt)} · {tournament.format}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Для этой игры пока нет активных турниров.</div>
              )}

              <Link href={`/games/${discipline.slug}`} className="text-link">
                Страница игры
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="section-bar">
            <div className="section-bar__title">
              <span className="section-bar__icon">03</span>
              <div className="space-y-2">
                <p className="eyebrow">Рейтинг</p>
                <h2 className="section-heading">Топ команд</h2>
              </div>
            </div>
            <Link href="/teams" className="text-link">
              Весь рейтинг
            </Link>
          </div>

          {topTeams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {topTeams.map((team, index) => {
                const captain = getTeamCaptain(store, team);

                return (
                  <article key={team.id} className="glass-panel space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-heading text-4xl uppercase leading-none text-[#d0d0c8]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <span className="surface-tag">{team.rating} pts</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#d7d7cf] bg-[#171717] text-sm font-black uppercase tracking-[0.14em] text-white">
                        {team.logo}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-2xl uppercase leading-none text-[#171717] [overflow-wrap:anywhere]">
                          {team.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#5a5a54]">
                          Капитан: {captain?.nickname ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="info-card">
                        <p className="info-card-label">Баланс</p>
                        <p className="info-card-value">
                          {team.wins}W / {team.losses}L
                        </p>
                      </div>
                      <div className="info-card">
                        <p className="info-card-label">Игроков</p>
                        <p className="info-card-value">{team.memberIds.length}</p>
                      </div>
                    </div>
                    <Link href={`/teams/${team.id}`} className="button-secondary w-full">
                      Открыть команду
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">Рейтинг появится после регистрации первых команд.</div>
          )}
        </div>

        <aside className="soft-panel space-y-4">
          <div className="space-y-2">
            <p className="eyebrow">Сводка</p>
            <h2 className="font-heading text-2xl uppercase leading-none text-[#171717]">
              Общая статистика
            </h2>
          </div>
          <div className="stat-tile">
            <p className="stat-label">Всего игр</p>
            <p className="stat-value">{store.disciplines.length}</p>
          </div>
          <div className="stat-tile">
            <p className="stat-label">Активных турниров</p>
            <p className="stat-value">{activeTournaments.length}</p>
          </div>
          <div className="stat-tile">
            <p className="stat-label">Команд всего</p>
            <p className="stat-value">{store.teams.length}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
