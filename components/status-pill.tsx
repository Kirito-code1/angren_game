import { formatTournamentStatus } from "@/lib/format";
import type { TournamentStatus } from "@/lib/types";

const statusClasses: Record<TournamentStatus, string> = {
  registration_open: "border-[#cce8d7] bg-[#effaf3] text-[#1f7b4f]",
  ongoing: "border-[#f4dfab] bg-[#fff7e5] text-[#9a6708]",
  completed: "border-[#d9e0ec] bg-[#f4f7fb] text-[#596880]",
};

export function StatusPill({ status }: { status: TournamentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] ${statusClasses[status]}`}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
      {formatTournamentStatus(status)}
    </span>
  );
}
