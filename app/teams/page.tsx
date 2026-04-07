import Link from "next/link";
import { createTeamAction, joinTeamAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { TeamCard } from "@/components/team-card";
import { getCurrentUser } from "@/lib/auth";
import { countryLabels } from "@/lib/catalog";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamCaptain } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();
  const currentUser = await getCurrentUser();

  const sortedTeams = [...store.teams].sort((a, b) => b.rating - a.rating);

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="eyebrow">Команды</p>
            <h1 className="section-heading">Команды и рейтинг</h1>
            <p className="section-copy">
              Здесь можно создать свою команду, вступить в состав и следить за позицией в рейтинге.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="hero-note">
              <strong>Всего команд</strong>
              {sortedTeams.length}
            </article>
            <article className="hero-note">
              <strong>Игроков на сайте</strong>
              {store.users.length}
            </article>
            <article className="hero-note">
              <strong>Лучший рейтинг</strong>
              {sortedTeams[0]?.rating ?? 0}
            </article>
          </div>
        </div>
      </section>

      {currentUser ? (
        currentUser.teamId ? (
          <section className="soft-panel p-5 text-sm leading-7 text-slate-600 sm:p-6">
            Вы уже состоите в команде. Перейдите в{" "}
            <Link href="/profile" className="text-link">
              профиль
            </Link>
            , чтобы управлять составом.
          </section>
        ) : (
          <section className="glass-panel p-5 sm:p-6">
            <div className="section-bar">
              <div className="section-bar__title">
                <span className="section-bar__icon">01</span>
                <div className="space-y-2">
                  <p className="eyebrow">Новая команда</p>
                  <h2 className="section-heading">Создать команду</h2>
                </div>
              </div>
            </div>

            <form action={createTeamAction} className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              <input type="hidden" name="returnTo" value="/teams" />
              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Название команды</span>
                <input name="name" required placeholder="Angren Falcons" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-slate-600">Логотип (2-3 символа)</span>
                <input name="logo" maxLength={3} placeholder="AF" />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="font-semibold text-slate-600">Страна</span>
                <select name="country" required defaultValue="">
                  <option value="">Выберите страну</option>
                  {Object.entries(countryLabels).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="button-primary w-full md:col-span-2 md:w-fit">
                Создать команду
              </button>
            </form>
          </section>
        )
      ) : (
        <section className="soft-panel p-5 text-sm leading-7 text-slate-600 sm:p-6">
          Чтобы создать команду или вступить в существующую, нужно{" "}
          <Link href="/login" className="text-link">
            войти в аккаунт
          </Link>
          .
        </section>
      )}

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">02</span>
            <div className="space-y-2">
              <p className="eyebrow">Рейтинг</p>
              <h2 className="section-heading">Текущий рейтинг</h2>
            </div>
          </div>
        </div>

        {sortedTeams.length > 0 ? (
          <div
            className={
              sortedTeams.length === 1
                ? "max-w-md"
                : sortedTeams.length === 2
                  ? "grid gap-5 md:grid-cols-2"
                  : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            }
          >
            {sortedTeams.map((team, index) => {
              const captain = getTeamCaptain(store, team);
              const canJoin =
                currentUser && !currentUser.teamId && !team.memberIds.includes(currentUser.id);

              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  rank={index + 1}
                  captainNickname={captain?.nickname}
                  action={
                    canJoin ? (
                      <form action={joinTeamAction}>
                        <input type="hidden" name="returnTo" value="/teams" />
                        <input type="hidden" name="teamId" value={team.id} />
                        <button type="submit" className="button-primary w-full">
                          Вступить в состав
                        </button>
                      </form>
                    ) : null
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            Пока нет команд. После первой регистрации здесь появится полноценный рейтинг.
          </div>
        )}
      </section>
    </div>
  );
}
