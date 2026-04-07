import { TournamentCard } from "@/components/tournament-card";
import { getTournamentsByStatus } from "@/lib/selectors";
import { readStore } from "@/lib/store";

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default async function TournamentsPage() {
  const store = await readStore();
  const open = getTournamentsByStatus(store, "registration_open");
  const ongoing = getTournamentsByStatus(store, "ongoing");
  const completed = getTournamentsByStatus(store, "completed");

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="hero-banner">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="eyebrow">Турниры</p>
            <h1 className="section-heading">Все турниры</h1>
            <p className="section-copy">
              Ближайшие, текущие и завершённые турниры. Выберите нужный статус и откройте
              подробности.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="hero-note">
              <strong>Регистрация открыта</strong>
              {formatCount(open.length)}
            </article>
            <article className="hero-note">
              <strong>Идут сейчас</strong>
              {formatCount(ongoing.length)}
            </article>
            <article className="hero-note">
              <strong>В архиве</strong>
              {formatCount(completed.length)}
            </article>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">01</span>
            <div className="space-y-2">
              <p className="eyebrow">Регистрация</p>
              <h2 className="section-heading">Регистрация открыта</h2>
            </div>
          </div>
        </div>

        {open.length > 0 ? (
          <div className={open.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {open.map((tournament) => {
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
          <div className="empty-state">Сейчас нет турниров с открытой регистрацией.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">02</span>
            <div className="space-y-2">
              <p className="eyebrow">В процессе</p>
              <h2 className="section-heading">Идут прямо сейчас</h2>
            </div>
          </div>
        </div>

        {ongoing.length > 0 ? (
          <div className={ongoing.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {ongoing.map((tournament) => {
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
          <div className="empty-state">Активных турниров сейчас нет.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-bar">
          <div className="section-bar__title">
            <span className="section-bar__icon">03</span>
            <div className="space-y-2">
              <p className="eyebrow">Архив</p>
              <h2 className="section-heading">Завершённые чемпионаты</h2>
            </div>
          </div>
        </div>

        {completed.length > 0 ? (
          <div className={completed.length === 1 ? "max-w-2xl" : "grid gap-5 lg:grid-cols-2"}>
            {completed.map((tournament) => {
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
          <div className="empty-state">Архив пока пуст.</div>
        )}
      </section>
    </div>
  );
}
