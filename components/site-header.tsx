import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { User } from "@/lib/types";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/tournaments", label: "Турниры" },
  { href: "/games", label: "Игры" },
  { href: "/teams", label: "Рейтинг" },
  { href: "/profile", label: "Профиль" },
  { href: "/admin", label: "Создать турнир" },
];

export function SiteHeader({ currentUser }: { currentUser: User | null }) {
  const visibleNavItems = navItems.filter((item) => {
    if (item.href !== "/admin") {
      return true;
    }

    return Boolean(currentUser);
  });

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3">
        <div className="hidden items-center justify-between rounded-full border border-[#e4e4de] bg-white/92 px-5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#77776f] shadow-[0_8px_24px_rgba(15,15,15,0.04)] md:flex">
          <p>Angren Game Circuit</p>
          <p>Турниры по мобильному киберспорту</p>
        </div>

        <div className="rounded-[1.7rem] border border-[#e4e4de] bg-white/94 px-4 py-4 shadow-[0_18px_50px_rgba(15,15,15,0.05)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[#d7d7cf] bg-[#111111] text-sm font-black uppercase tracking-[0.22em] text-white">
                AG
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block truncate font-heading text-lg uppercase leading-none text-[#171717] sm:text-xl">
                  Angren Game
                </span>
                <span className="block text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[#77776f] sm:text-xs sm:tracking-[0.18em]">
                  Турниры и команды
                </span>
              </span>
            </Link>

            <nav className="order-2 flex w-full flex-wrap items-center gap-2 border-t border-[#ecece6] pt-3 md:order-3 md:flex-1 md:justify-center md:border-t-0 md:pt-0 xl:justify-center">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#5a5a54] hover:bg-[#f4f4f2] hover:text-[#171717]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="order-3 grid w-full min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-2 md:order-2 md:ml-auto md:flex md:w-auto md:min-w-fit md:flex-wrap md:justify-end">
              {currentUser ? (
                <>
                  <p className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-[#e4e4de] bg-[#f4f4f2] px-4 py-2 text-sm font-semibold text-[#171717] sm:flex-none sm:justify-start">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#111111]" />
                    <span className="truncate">{currentUser.nickname}</span>
                  </p>
                  <form action={logoutAction} className="w-full md:w-auto">
                    <button type="submit" className="button-secondary w-full sm:w-auto">
                      Выйти
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="button-secondary w-full md:w-auto">
                    Войти
                  </Link>
                  <Link href="/register" className="button-primary w-full md:w-auto">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
