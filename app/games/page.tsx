import Link from "next/link";
import { getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";

export default async function GamesPage() {
  const store = await readStore();
  const activeTournamentCount = store.tournaments.filter(
    (tournament) => tournament.status !== "completed",
  ).length;

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="hero-banner">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="eyebrow">Игры</p>
            <h1 className="section-heading">Игры</h1>
            <p className="section-copy">
              Выберите игру и посмотрите ближайшие турниры, форматы и архив.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="hero-note">
              <strong>Игр</strong>
              {store.disciplines.length}
            </article>
            <article className="hero-note">
              <strong>Активных турниров</strong>
              {activeTournamentCount}
            </article>
            <article className="hero-note">
              <strong>В фокусе</strong>
              {store.disciplines.filter((discipline) => discipline.featured).length}
            </article>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">Каталог</p>
              <h2 className="section-heading">Каталог игр</h2>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {store.disciplines.map((discipline) => {
            const tournaments = getTournamentsByDiscipline(store, discipline.slug);
            const activeCount = tournaments.filter(
              (tournament) => tournament.status !== "completed",
            ).length;
            const archivedCount = tournaments.filter(
              (tournament) => tournament.status === "completed",
            ).length;

            return (
              <article
                key={discipline.slug}
                className="glass-panel flex flex-col gap-5 rounded-[1.75rem]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1rem] border border-[#d7d7cf] bg-[#f4f4f2] text-lg font-black uppercase tracking-[0.14em] text-[#171717]">
                    {discipline.icon}
                  </span>
                  {discipline.featured ? <span className="surface-tag">В фокусе</span> : null}
                </div>

                <div className="space-y-2">
                  <p className="eyebrow">Игра</p>
                  <h2 className="font-heading text-3xl uppercase leading-none text-[#171717]">
                    {discipline.shortTitle}
                  </h2>
                </div>

                <p className="text-sm leading-7 text-[#5a5a54]">{discipline.description}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="info-card">
                    <p className="info-card-label">Активных турниров</p>
                    <p className="info-card-value">{activeCount}</p>
                  </div>
                  <div className="info-card">
                    <p className="info-card-label">Архив</p>
                    <p className="info-card-value">{archivedCount}</p>
                  </div>
                </div>

                <div className="info-card">
                  <p className="info-card-label">Форматы</p>
                  <p className="info-card-value">{discipline.formats.join(" · ")}</p>
                </div>

                <Link href={`/games/${discipline.slug}`} className="button-secondary mt-auto w-full">
                  Перейти к турнирам
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
