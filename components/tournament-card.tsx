import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatPrizePool } from "@/lib/format";
import type { Tournament } from "@/lib/types";

const disciplineAccents: Record<string, string> = {
  "pubg-mobile": "bg-[#f3f1eb] text-[#171717]",
  "mobile-legends": "bg-[#f1f1f6] text-[#171717]",
};

export function TournamentCard({
  tournament,
  disciplineTitle,
}: {
  tournament: Tournament;
  disciplineTitle?: string;
}) {
  const accentClass = disciplineAccents[tournament.disciplineSlug] ?? "bg-[#f4f4f2] text-[#171717]";

  return (
    <article className="tournament-card">
      <div className="tournament-card__banner">
        <div className="relative z-10 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <span
            className={`inline-flex items-center rounded-full border border-[#e4e4de] px-3 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] ${accentClass}`}
          >
            {disciplineTitle ?? tournament.disciplineSlug}
          </span>
          <StatusPill status={tournament.status} />
        </div>

        <div className="relative z-10 mt-8 space-y-3">
          <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-[#8a8a82]">
            Турнир
          </p>
          <h3 className="font-heading text-[1.9rem] uppercase leading-[0.92] text-[#171717] [overflow-wrap:anywhere]">
            {tournament.title}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-[#5a5a54]">
            Посмотрите дату старта, призовой фонд, формат и сразу перейдите на полную страницу
            турнира.
          </p>
        </div>
      </div>

      <div className="tournament-card__body">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="info-card">
            <p className="info-card-label">Старт</p>
            <p className="info-card-value">{formatDate(tournament.startsAt)}</p>
          </div>
          <div className="info-card">
            <p className="info-card-label">Призовой</p>
            <p className="info-card-value">{formatPrizePool(tournament.prizePoolUSD)}</p>
          </div>
          <div className="info-card">
            <p className="info-card-label">Формат</p>
            <p className="info-card-value">{tournament.format}</p>
          </div>
          <div className="info-card">
            <p className="info-card-label">Слоты</p>
            <p className="info-card-value">
              {tournament.approvedTeamIds.length} / {tournament.teamLimit}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Подробнее
          </p>
          <Link href={`/tournaments/${tournament.id}`} className="button-secondary w-full sm:w-auto">
            Открыть турнир
          </Link>
        </div>
      </div>
    </article>
  );
}
