import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveTeamAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import {
  disciplineDesigns,
  getDisplayStore,
  getPromoStore,
  promoCurrentUserId,
  promoNews,
  promoRecentActivity,
} from "@/lib/design-data";
import { getCurrentUser } from "@/lib/auth";
import { formatCountry, formatDate, formatPrizePool } from "@/lib/format";
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
  const fallbackPromoStore = getPromoStore(store.disciplines);
  const displayStore = currentUser ? getDisplayStore(store) : fallbackPromoStore;
  const displayUser =
    currentUser ??
    fallbackPromoStore.users.find((user) => user.id === promoCurrentUserId) ??
    null;

  if (!displayUser) {
    notFound();
  }

  const team = displayUser.teamId ? getTeamById(displayStore, displayUser.teamId) : null;
  const historyTournaments = displayUser.tournamentHistory
    .map((tournamentId) => getTournamentById(displayStore, tournamentId))
    .filter((tournament): tournament is NonNullable<typeof tournament> => Boolean(tournament));
  const createdTournaments = displayStore.tournaments.filter((tournament) =>
    matchesUserIdentifier(displayUser, tournament.creatorUserId),
  );
  const upcomingTournament =
    historyTournaments.find((tournament) => tournament.status !== "completed") ??
    displayStore.tournaments.find((tournament) => tournament.status !== "completed") ??
    null;
  const totalPrize = historyTournaments.reduce(
    (sum, tournament) => sum + tournament.prizePoolUSD,
    0,
  );
  const profileDisciplineSlug =
    upcomingTournament?.disciplineSlug ??
    historyTournaments[0]?.disciplineSlug ??
    displayUser.disciplines[0] ??
    "mobile-legends";
  const profileDesign =
    disciplineDesigns[profileDisciplineSlug] ?? disciplineDesigns["mobile-legends"];

  const statCards = [
    {
      label: "Matches",
      value: team ? team.wins + team.losses : historyTournaments.length,
      tone: "gold",
    },
    {
      label: "Tournaments",
      value: historyTournaments.length,
      tone: "violet",
    },
    {
      label: "Win Rate",
      value:
        team && team.wins + team.losses > 0
          ? `${((team.wins / (team.wins + team.losses)) * 100).toFixed(1)}%`
          : "58.3%",
      tone: "mint",
    },
    {
      label: "Prize Pool",
      value: totalPrize > 0 ? formatPrizePool(totalPrize) : "$3,750",
      tone: "neutral",
    },
  ];

  const sidebarLinks = [
    { label: "My Tournaments", href: "/tournaments" },
    { label: "Matches", href: upcomingTournament ? `/tournaments/${upcomingTournament.id}` : "/tournaments" },
    { label: "Profile", href: "/profile" },
    { label: "Messages", href: upcomingTournament ? `/tournaments/${upcomingTournament.id}` : "/tournaments" },
    { label: "Settings", href: "/profile" },
  ];

  return (
    <div className="clutch-page space-y-8">
      <FlashMessage message={message} />

      <section className="clutch-dashboard-shell">
        <aside className="clutch-dashboard-sidebar">
          <div className="clutch-dashboard-sidebar__brand">
            <span className="site-brand__mark">AG</span>
            <div>
              <strong>ClutchMaster</strong>
              <span>Dashboard</span>
            </div>
          </div>

          <nav className="clutch-dashboard-sidebar__nav">
            {sidebarLinks.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`clutch-dashboard-sidebar__link ${index === 0 ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {currentUser && team ? (
            <form action={leaveTeamAction} className="mt-auto">
              <input type="hidden" name="returnTo" value="/profile" />
              <button type="submit" className="button-secondary w-full">
                Leave Team
              </button>
            </form>
          ) : (
            <Link href={currentUser ? "/teams" : "/register"} className="button-primary mt-auto w-full">
              {currentUser ? "Manage Team" : "Create Account"}
            </Link>
          )}
        </aside>

        <div className="clutch-dashboard-main">
          <section className="clutch-profile-hero">
            <div className="clutch-profile-hero__cover">
              <Image
                src={profileDesign.art}
                alt="Profile cover art"
                fill
                sizes="(min-width: 1280px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="clutch-profile-hero__content">
              <div className="clutch-profile-hero__user">
                <span className="clutch-profile-hero__avatar">{displayUser.nickname.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h1>{displayUser.nickname}</h1>
                  <p>{formatCountry(displayUser.country)} • {team?.name ?? "Free Agent"}</p>
                </div>
              </div>

              <div className="clutch-profile-hero__mini-stats">
                <article>
                  <span>Current rank</span>
                  <strong>#{team ? 128 : 780}</strong>
                </article>
                <article>
                  <span>Season rating</span>
                  <strong>{team?.rating ?? 1250}</strong>
                </article>
                <article>
                  <span>Role</span>
                  <strong>{displayUser.role}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="clutch-dashboard-stats">
            {statCards.map((card) => (
              <article key={card.label} className={`clutch-dashboard-stat clutch-dashboard-stat--${card.tone}`}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          <section className="clutch-dashboard-grid">
            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">Upcoming Match</p>
                  <h2>{upcomingTournament?.title ?? "PUBG Weekly Cup"}</h2>
                </div>
                <Link
                  href={upcomingTournament ? `/tournaments/${upcomingTournament.id}` : "/tournaments"}
                  className="clutch-table-link"
                >
                  Open
                </Link>
              </div>

              <div className="clutch-upcoming-match">
                <div>
                  <span>Starts in</span>
                  <strong>02:45:18</strong>
                </div>
                <div>
                  <span>Format</span>
                  <strong>{upcomingTournament?.format ?? "Team Battle"}</strong>
                </div>
                <div>
                  <span>Prize Pool</span>
                  <strong>
                    {upcomingTournament ? formatPrizePool(upcomingTournament.prizePoolUSD) : "$1,000"}
                  </strong>
                </div>
              </div>
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">My Tournaments</p>
                  <h2>Active Runs</h2>
                </div>
                <Link href="/tournaments" className="clutch-table-link">
                  See all
                </Link>
              </div>

              <div className="clutch-dashboard-list">
                {(historyTournaments.length > 0 ? historyTournaments : displayStore.tournaments.slice(0, 3)).map(
                  (tournament) => (
                    <article key={tournament.id} className="clutch-dashboard-list__item">
                      <div>
                        <strong>{tournament.title}</strong>
                        <span>{formatDate(tournament.startsAt)}</span>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                        Open
                      </Link>
                    </article>
                  ),
                )}
              </div>
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">Recent Activity</p>
                  <h2>Timeline</h2>
                </div>
              </div>

              <div className="clutch-dashboard-list">
                {promoRecentActivity.map((entry) => (
                  <article key={`${entry.title}-${entry.date}`} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.status}</span>
                    </div>
                    <span className="clutch-dashboard-list__date">{entry.date}</span>
                  </article>
                ))}
              </div>
            </article>

            <article className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">News & Updates</p>
                  <h2>Latest</h2>
                </div>
              </div>

              <div className="clutch-dashboard-news">
                {promoNews.map((entry) => (
                  <article key={entry.title} className="clutch-dashboard-news__item">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.date}</span>
                    </div>
                    <em>{entry.tag}</em>
                  </article>
                ))}
              </div>
            </article>
          </section>

          {createdTournaments.length > 0 ? (
            <section className="clutch-dashboard-card">
              <div className="clutch-dashboard-card__header">
                <div>
                  <p className="clutch-page__eyebrow">Organizer View</p>
                  <h2>Created Tournaments</h2>
                </div>
                <Link href="/admin" className="clutch-table-link">
                  Panel
                </Link>
              </div>

              <div className="clutch-dashboard-list">
                {createdTournaments.map((tournament) => (
                  <article key={tournament.id} className="clutch-dashboard-list__item">
                    <div>
                      <strong>{tournament.title}</strong>
                      <span>{formatDate(tournament.startsAt)}</span>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`} className="clutch-table-link">
                      Open
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
