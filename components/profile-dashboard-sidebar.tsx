import Link from "next/link";
import { leaveTeamAction, logoutAction } from "@/app/actions";
import type { User } from "@/lib/types";

type ProfileDashboardSidebarProps = {
  activePath: "/profile" | "/profile/tournaments";
  currentUser: User;
  dashboardLabel: string;
  profileLabel: string;
  myTournamentsLabel: string;
  manageTeamLabel: string;
  leaveTeamLabel: string;
  logOutLabel: string;
  hasTeam: boolean;
};

export function ProfileDashboardSidebar({
  activePath,
  currentUser,
  dashboardLabel,
  profileLabel,
  myTournamentsLabel,
  manageTeamLabel,
  leaveTeamLabel,
  logOutLabel,
  hasTeam,
}: ProfileDashboardSidebarProps) {
  const navItems = [
    { label: myTournamentsLabel, href: "/profile/tournaments" as const },
    { label: profileLabel, href: "/profile" as const },
  ];

  return (
    <aside className="clutch-dashboard-sidebar">
      <div className="clutch-dashboard-sidebar__brand">
        <span className="site-brand__mark">AG</span>
        <div>
          <strong>{currentUser.nickname}</strong>
          <span>{dashboardLabel}</span>
        </div>
      </div>

      <nav className="clutch-dashboard-sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`clutch-dashboard-sidebar__link ${item.href === activePath ? "is-active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto grid gap-3">
        {hasTeam ? (
          <form action={leaveTeamAction}>
            <input type="hidden" name="returnTo" value={activePath} />
            <button type="submit" className="button-secondary w-full">
              {leaveTeamLabel}
            </button>
          </form>
        ) : (
          <Link href="/teams" className="button-primary w-full">
            {manageTeamLabel}
          </Link>
        )}

        <form action={logoutAction}>
          <button type="submit" className="button-danger w-full">
            {logOutLabel}
          </button>
        </form>
      </div>
    </aside>
  );
}
