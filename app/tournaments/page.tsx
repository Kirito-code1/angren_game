import Image from "next/image";
import Link from "next/link";
import { disciplineDesigns, getDisplayStore, isStoreInPromoMode } from "@/lib/design-data";
import { formatDate, formatPrizePool } from "@/lib/format";
import { getTournamentsByStatus } from "@/lib/selectors";
import { readStore } from "@/lib/store";

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default async function TournamentsPage() {
  const store = await readStore();
  const promoMode = isStoreInPromoMode(store);
  const displayStore = getDisplayStore(store);

  const open = getTournamentsByStatus(displayStore, "registration_open");
  const ongoing = getTournamentsByStatus(displayStore, "ongoing");
  const completed = getTournamentsByStatus(displayStore, "completed");
  const tournaments = sortByDate([...ongoing, ...open, ...completed]);
  const featuredTournament = tournaments[0] ?? null;
  const totalPrizePool = displayStore.tournaments.reduce(
    (sum, tournament) => sum + tournament.prizePoolUSD,
    0,
  );

  const filterItems = [
    { label: "All", value: tournaments.length },
    { label: "Live", value: ongoing.length },
    { label: "Open", value: open.length },
    { label: "Completed", value: completed.length },
  ];

  return (
    <div className="clutch-page">
      <section className="clutch-page__header">
        <div className="clutch-page__header-main">
          <p className="clutch-page__eyebrow">Compete in the best events. Win glory.</p>
          <h1 className="clutch-page__title">Tournaments</h1>

          <div className="clutch-mock-toolbar" role="search" aria-label="Tournament filters">
            <input
              type="search"
              name="q"
              placeholder="Search tournaments…"
              className="clutch-mock-search"
              autoComplete="off"
            />
            <select className="clutch-mock-select" aria-label="Game" defaultValue="">
              <option value="">Game</option>
              {displayStore.disciplines.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.shortTitle}
                </option>
              ))}
            </select>
            <select className="clutch-mock-select" aria-label="Status" defaultValue="">
              <option value="">Status</option>
              <option value="live">Live</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
            </select>
            <select className="clutch-mock-select" aria-label="Prize pool" defaultValue="">
              <option value="">Prize pool</option>
              <option value="1">$0 – $500</option>
              <option value="2">$500 – $2,000</option>
              <option value="3">$2,000+</option>
            </select>
          </div>
        </div>

        <div className="clutch-toolbar clutch-page__header-filters">
          {filterItems.map((item, index) => (
            <span key={item.label} className={`clutch-toolbar__pill ${index === 0 ? "is-active" : ""}`}>
              {item.label}
              <strong>{formatCount(item.value)}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="clutch-list-layout">
        <div className="clutch-list-shell">
          <div className="clutch-list-shell__bar">
            <span>All tournaments</span>
            <span>{formatCount(tournaments.length)} total</span>
          </div>

          <div className="clutch-tournament-list">
            {tournaments.map((tournament) => {
              const discipline = displayStore.disciplines.find(
                (entry) => entry.slug === tournament.disciplineSlug,
              );
              const design = disciplineDesigns[tournament.disciplineSlug] ?? disciplineDesigns["pubg-mobile"];
              const statusLabel =
                tournament.status === "ongoing"
                  ? "Live"
                  : tournament.status === "registration_open"
                    ? "Open"
                    : "Ended";
              const statusBadgeClass =
                tournament.status === "ongoing"
                  ? "clutch-status-badge--live"
                  : tournament.status === "registration_open"
                    ? "clutch-status-badge--open"
                    : "clutch-status-badge--ended";
              const ctaLabel =
                promoMode
                  ? "View demo"
                  : tournament.status === "completed"
                    ? "View results"
                    : "Join now";

              return (
                <article key={tournament.id} className="clutch-tournament-row">
                  <div className="clutch-tournament-row__media">
                    <Image
                      src={design.art}
                      alt={`Poster for ${tournament.title}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                    <span className={`clutch-status-badge ${statusBadgeClass}`}>{statusLabel}</span>
                  </div>

                  <div className="clutch-tournament-row__body">
                    <div className="clutch-tournament-row__top">
                      <div className="space-y-2">
                        <div className="clutch-tournament-row__meta">
                          <span>{discipline?.shortTitle ?? tournament.disciplineSlug}</span>
                          <span>{tournament.format}</span>
                          <span>{formatDate(tournament.startsAt)}</span>
                        </div>
                        <h2 className="clutch-tournament-row__title">{tournament.title}</h2>
                      </div>

                      <div className="clutch-tournament-row__stats">
                        <div>
                          <span>Prize Pool</span>
                          <strong>{formatPrizePool(tournament.prizePoolUSD)}</strong>
                        </div>
                        <div>
                          <span>Teams</span>
                          <strong>
                            {tournament.approvedTeamIds.length}/{tournament.teamLimit}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="clutch-tournament-row__bottom">
                      <p className="clutch-tournament-row__copy">
                        {tournament.status === "completed"
                          ? "Tournament finished. Open the page to review the bracket and results."
                          : "Open the event page to check slots, bracket, rules, and tournament updates."}
                      </p>
                      <Link href={`/tournaments/${tournament.id}`} className="clutch-action-button">
                        {ctaLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="clutch-sidebar">
          <article className="clutch-sidebar-card">
            <div className="clutch-sidebar-card__header">
              <h2>Popular Games</h2>
              <span>{displayStore.disciplines.length} titles</span>
            </div>

            <div className="clutch-game-stack">
              {displayStore.disciplines.map((discipline) => {
                const design = disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"];

                return (
                  <article key={discipline.slug} className="clutch-game-mini">
                    <div className="clutch-game-mini__thumb">
                      <Image
                        src={design.art}
                        alt={`Artwork for ${discipline.shortTitle}`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <strong>{discipline.shortTitle}</strong>
                      <span>{discipline.formats.join(" / ")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">Prize pool tracker</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {featuredTournament ? featuredTournament.title : "Season reward pool"}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>{formatPrizePool(totalPrizePool)}</strong>
              <span>{promoMode ? "demo showcase" : "across current events"}</span>
            </div>

            <div className="clutch-sidebar-card__promo-art">
              <Image
                src="/game_img/16779410.png"
                alt="Prize pool illustration"
                fill
                sizes="320px"
                className="object-contain"
              />
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
