import Link from "next/link";
import type { ReactNode } from "react";
import { formatCountry } from "@/lib/format";
import type { Team } from "@/lib/types";

export function TeamCard({
  team,
  captainNickname,
  rank,
  action,
}: {
  team: Team;
  captainNickname?: string;
  rank?: number;
  action?: ReactNode;
}) {
  const isLeader = rank === 1;

  return (
    <article className={`team-rank-card ${isLeader ? "team-rank-card--leader" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="team-rank-card__rank">{rank ? String(rank).padStart(2, "0") : "TEAM"}</p>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
            {formatCountry(team.country)}
          </p>
        </div>
        <span className="surface-tag">Rating {team.rating}</span>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1rem] border border-[#d7d7cf] bg-[#171717] text-base font-black uppercase tracking-[0.12em] text-white">
          {team.logo}
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="font-heading text-2xl uppercase leading-none text-[#171717] [overflow-wrap:anywhere]">
            {team.name}
          </h3>
          <p className="text-sm text-[#5a5a54]">Контакт команды: {captainNickname ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="info-card">
          <p className="info-card-label">Состав</p>
          <p className="info-card-value">{team.memberIds.length} в составе</p>
        </div>
        <div className="info-card">
          <p className="info-card-label">Баланс</p>
          <p className="info-card-value">
            {team.wins}W / {team.losses}L
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-slate-200 pt-4">
        <Link href={`/teams/${team.id}`} className="button-secondary w-full">
          Страница команды
        </Link>
        {action}
      </div>
    </article>
  );
}
