import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashMessage } from "@/components/flash-message";
import { TournamentCard } from "@/components/tournament-card";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getDisciplineBySlug, getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DisciplinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();

  const discipline = getDisciplineBySlug(store, slug);

  if (!discipline) {
    notFound();
  }

  const tournaments = getTournamentsByDiscipline(store, slug);
  const active = tournaments.filter((tournament) => tournament.status !== "completed");
  const archive = tournaments.filter((tournament) => tournament.status === "completed");

  return (
    <div className="space-y-8 lg:space-y-10">
      <FlashMessage message={message} />

      <section className="hero-banner">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-[1.1rem] border border-[#d7d7cf] bg-[#f4f4f2] text-lg font-black uppercase tracking-[0.14em] text-[#171717]">
                {discipline.icon}
              </span>
              <div className="min-w-0 space-y-3">
                <p className="eyebrow">Дисциплина</p>
                <h1 className="section-heading">{discipline.title}</h1>
                <p className="section-copy">{discipline.description}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="hero-note">
                <strong>Актуальных турниров</strong>
                {active.length}
              </article>
              <article className="hero-note">
                <strong>Архивных событий</strong>
                {archive.length}
              </article>
              <article className="hero-note">
                <strong>Форматы</strong>
                {discipline.formats.join(" · ")}
              </article>
            </div>
          </div>

          <div className="flex items-start">
            <Link href="/games" className="button-secondary w-full sm:w-auto">
              Назад к каталогу
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">Текущие турниры</p>
              <h2 className="section-heading">Актуальные турниры</h2>
            </div>
          </div>
        </div>

        {active.length > 0 ? (
          <div className={active.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {active.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                disciplineTitle={discipline.shortTitle}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Пока нет открытых или активных турниров.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">02</span>
            <div className="space-y-2">
              <p className="eyebrow">Архив</p>
              <h2 className="section-heading">Архив турниров</h2>
            </div>
          </div>
        </div>

        {archive.length > 0 ? (
          <div className={archive.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {archive.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                disciplineTitle={discipline.shortTitle}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Архив по этой игре пока пуст.</div>
        )}
      </section>
    </div>
  );
}
