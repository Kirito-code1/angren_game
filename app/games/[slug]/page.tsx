import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashMessage } from "@/components/flash-message";
import { disciplineDesigns, getDisplayStore } from "@/lib/design-data";
import { formatDate, formatPrizePool } from "@/lib/format";
import { getMessageFromSearchParams } from "@/lib/messages";
import { getDisciplineBySlug, getTournamentsByDiscipline } from "@/lib/selectors";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

function sortByDate<T extends { startsAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

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
  const displayStore = getDisplayStore(store);

  const discipline = getDisciplineBySlug(displayStore, slug);

  if (!discipline) {
    notFound();
  }

  const design = disciplineDesigns[discipline.slug] ?? disciplineDesigns["pubg-mobile"];
  const tournaments = sortByDate(getTournamentsByDiscipline(displayStore, slug));
  const liveTournaments = tournaments.filter((tournament) => tournament.status !== "completed");
  const archiveTournaments = tournaments.filter((tournament) => tournament.status === "completed");
  const totalPrizePool = tournaments.reduce((sum, tournament) => sum + tournament.prizePoolUSD, 0);
  const participatingTeams = new Set(
    tournaments.flatMap((tournament) => tournament.approvedTeamIds),
  ).size;
  const featuredTournament = liveTournaments[0] ?? tournaments[0] ?? null;

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-detail-hero">
        <article className="clutch-detail-banner">
          <div className="clutch-detail-banner__media">
            <Image
              src={design.art}
              alt={`Artwork for ${discipline.title}`}
              fill
              priority
              sizes="(min-width: 1280px) 62vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="clutch-detail-banner__overlay" />
          <div className="clutch-detail-banner__content">
            <div className="clutch-detail-banner__top">
              <span className={`landing-chip ${design.badgeClass}`}>{design.label}</span>
              <span className="landing-chip landing-chip--glass">
                {featuredTournament?.format ?? discipline.formats.join(" / ")}
              </span>
            </div>

            <div className="space-y-3">
              <p className="clutch-page__eyebrow">Game overview</p>
              <h1 className="clutch-detail-banner__title">{discipline.title}</h1>
              <p className="clutch-detail-banner__copy">{discipline.description}</p>
            </div>

            <div className="clutch-detail-banner__actions">
              <Link href="/games" className="clutch-ghost-button">
                Back to Games
              </Link>
              <Link href="/tournaments" className="clutch-action-button">
                Browse Events
              </Link>
            </div>
          </div>
        </article>

        <aside className="clutch-detail-sidecard">
          <div className="clutch-detail-sidecard__stats">
            <article>
              <span>Active</span>
              <strong>{formatCount(liveTournaments.length)}</strong>
            </article>
            <article>
              <span>Archive</span>
              <strong>{formatCount(archiveTournaments.length)}</strong>
            </article>
            <article>
              <span>Teams</span>
              <strong>{formatCount(participatingTeams)}</strong>
            </article>
            <article>
              <span>Prize Pool</span>
              <strong>{formatPrizePool(totalPrizePool)}</strong>
            </article>
          </div>

          <div className="clutch-detail-sidecard__organizer">
            <p>Formats</p>
            <strong>{discipline.formats.join(" / ")}</strong>
            <span>{discipline.shortTitle}</span>
          </div>

          <div className="clutch-detail-sidecard__summary">
            <span>{featuredTournament ? formatDate(featuredTournament.startsAt) : "calendar pending"}</span>
            <span>{featuredTournament ? featuredTournament.title : "No upcoming event yet"}</span>
          </div>
        </aside>
      </section>

      <div className="clutch-tabs">
        <span className="is-active">Overview</span>
        <span>{liveTournaments.length} Active</span>
        <span>{archiveTournaments.length} Archive</span>
        <span>{discipline.formats.length} Formats</span>
      </div>

      <section className="clutch-list-layout">
        <div className="clutch-list-shell">
          <div className="clutch-list-shell__bar">
            <span>{discipline.shortTitle} tournaments</span>
            <span>{formatCount(tournaments.length)} total</span>
          </div>

          {tournaments.length > 0 ? (
            <div className="clutch-tournament-list">
              {tournaments.map((tournament) => {
                const statusLabel =
                  tournament.status === "ongoing"
                    ? "Live"
                    : tournament.status === "registration_open"
                      ? "Open"
                      : "Ended";

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
                      <span className={`clutch-status-badge ${design.accentClass}`}>{statusLabel}</span>
                    </div>

                    <div className="clutch-tournament-row__body">
                      <div className="clutch-tournament-row__top">
                        <div className="space-y-2">
                          <div className="clutch-tournament-row__meta">
                            <span>{discipline.shortTitle}</span>
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
                            ? "Completed event with saved results and closed bracket."
                            : "Open the event page to inspect participants, rules, and match flow."}
                        </p>
                        <Link href={`/tournaments/${tournament.id}`} className="clutch-action-button">
                          Open Tournament
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="clutch-empty-panel">
              Пока нет турниров в этой дисциплине. Страница уже готова под следующий анонс.
            </div>
          )}
        </div>

        <aside className="clutch-sidebar">
          <article className="clutch-sidebar-card">
            <div className="clutch-sidebar-card__header">
              <h2>Playbook</h2>
              <span>{discipline.formats.length} modes</span>
            </div>

            <div className="clutch-rules-list">
              {discipline.formats.map((format) => (
                <article key={format} className="clutch-rules-list__item">
                  {format}
                </article>
              ))}
            </div>
          </article>

          <article className="clutch-sidebar-card clutch-sidebar-card--promo">
            <div className="space-y-2">
              <span className="clutch-page__eyebrow">Spotlight</span>
              <h2 className="clutch-sidebar-card__promo-title">
                {featuredTournament?.title ?? `${discipline.shortTitle} Season`}
              </h2>
            </div>

            <div className="clutch-sidebar-card__promo-value">
              <strong>
                {featuredTournament ? formatPrizePool(featuredTournament.prizePoolUSD) : formatPrizePool(0)}
              </strong>
              <span>{featuredTournament ? formatDate(featuredTournament.startsAt) : "schedule pending"}</span>
            </div>

            <div className="clutch-sidebar-card__promo-art">
              <Image
                src={design.art}
                alt={`Spotlight art for ${discipline.shortTitle}`}
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
