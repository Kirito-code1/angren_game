import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveTeamAction, removeTeamMemberAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getCurrentUser } from "@/lib/auth";
import { formatCountry } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getTeamById, getTeamMembers } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

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
  const team = getTeamById(store, id);

  if (!team) {
    notFound();
  }

  const members = getTeamMembers(store, team);
  const isCaptain = currentUser?.id === team.captainId;
  const isMember = currentUser ? team.memberIds.includes(currentUser.id) : false;

  const tournamentHistory = store.tournaments.filter(
    (tournament) =>
      tournament.appliedTeamIds.includes(team.id) ||
      tournament.approvedTeamIds.includes(team.id),
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-[1.3rem] border border-[#d7d7cf] bg-[#171717] px-4 text-xl font-black uppercase tracking-[0.18em] text-white">
                {team.logo}
              </span>
              <div className="min-w-0 space-y-3">
                <p className="eyebrow">Team profile</p>
                <h1 className="section-heading">{team.name}</h1>
                <p className="section-copy">{formatCountry(team.country)}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="hero-note">
                <strong>Рейтинг</strong>
                {team.rating}
              </article>
              <article className="hero-note">
                <strong>Победы</strong>
                {team.wins}
              </article>
              <article className="hero-note">
                <strong>Поражения</strong>
                {team.losses}
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Roster</p>
            <h2 className="section-heading">Состав</h2>
          </div>

          <div className="mt-6 space-y-3">
            {members.map((member) => (
              <article key={member.id} className="info-card text-sm">
                <p className="font-semibold text-[#171717]">{member.nickname}</p>
                <p className="mt-2 text-[#5a5a54]">{formatCountry(member.country)}</p>
                <p className="mt-2 text-[#5a5a54]">Email: {member.email}</p>

                {isCaptain && member.id !== currentUser?.id ? (
                  <form action={removeTeamMemberAction} className="mt-4">
                    <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100"
                    >
                      Удалить из состава
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <article className="soft-panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="eyebrow">Control</p>
            <h2 className="section-heading">Управление</h2>
          </div>

          {isCaptain ? (
            <p className="mt-6 text-sm leading-7 text-[#5a5a54]">
              У вас есть доступ к управлению составом, удалению участников и подаче заявок на
              турниры.
            </p>
          ) : isMember ? (
            <p className="mt-6 text-sm leading-7 text-[#5a5a54]">
              Для изменений состава нужен доступ аккаунта, который управляет этой командой.
            </p>
          ) : (
            <p className="mt-6 text-sm leading-7 text-[#5a5a54]">Вы не состоите в этой команде.</p>
          )}

          {isMember ? (
            <form action={leaveTeamAction} className="mt-6">
              <input type="hidden" name="returnTo" value={`/teams/${team.id}`} />
              <button
                type="submit"
                className="w-full rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Покинуть команду
              </button>
            </form>
          ) : (
            <Link href="/teams" className="button-secondary mt-6 w-full">
              Вернуться к списку команд
            </Link>
          )}
        </article>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">History</p>
              <h2 className="section-heading">Участие в турнирах</h2>
            </div>
          </div>
        </div>

        {tournamentHistory.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tournamentHistory.map((tournament) => (
              <article key={tournament.id} className="info-card">
                <p className="font-heading text-xl uppercase leading-none text-[#171717]">
                  {tournament.title}
                </p>
                <p className="mt-3 text-sm text-[#5a5a54]">Статус: {tournament.status}</p>
                <Link href={`/tournaments/${tournament.id}`} className="text-link mt-4">
                  Открыть турнир
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Команда ещё не участвовала в турнирах.</div>
        )}
      </section>

      <section className="soft-panel p-5 text-sm leading-7 text-[#5a5a54] sm:p-6">
        <p className="font-semibold text-[#171717]">Быстрые действия</p>
        <p className="mt-2">
          Для подачи новой заявки откройте раздел{" "}
          <Link href="/tournaments" className="text-link">
            турниров
          </Link>{" "}
          и выберите нужный чемпионат.
        </p>
      </section>
    </div>
  );
}
