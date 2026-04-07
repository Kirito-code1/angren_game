import Link from "next/link";

const footerLinks = [
  { href: "/tournaments", label: "Все турниры" },
  { href: "/games", label: "Каталог игр" },
  { href: "/teams", label: "Рейтинг команд" },
  { href: "/login", label: "Войти" },
  { href: "/register", label: "Регистрация" },
];

const footerHighlights = [
  "Смотрите ближайшие и завершённые турниры.",
  "Подавайте заявки командой за пару кликов.",
  "Следите за рейтингом и результатами матчей.",
];

export function SiteFooter() {
  return (
    <footer className="mt-10 w-full border-t border-[#e4e4de] bg-[#f3f3f0] text-[#171717]">
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-[#e4e4de] py-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#77776f]">
              Angren Game
            </p>
            <p className="font-heading text-[clamp(2rem,4vw,3.5rem)] uppercase leading-none text-[#171717]">
              Турниры и матчи
            </p>
            <p className="max-w-2xl text-sm leading-7 text-[#5a5a54]">
              Расписание, регистрация, составы команд и сетка матчей в одном месте.
            </p>
          </div>

          <Link href="/tournaments" className="button-primary w-full sm:w-auto">
            Открыть турниры
          </Link>
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.75fr_1fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e4e4de] bg-white px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#171717]">
              <span className="h-2 w-2 rounded-full bg-[#171717]" />
              Мобильный киберспорт
            </span>
            <p className="max-w-xl text-sm leading-7 text-[#5a5a54]">
              Следите за турнирами, собирайте состав, подавайте заявки и держите под рукой
              рейтинг команд и сетку матчей.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77776f]">
              Навигация
            </p>
            <div className="flex flex-col gap-3 text-sm font-semibold text-[#171717]">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-[#4f4f49] hover:text-[#171717]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77776f]">
              Что внутри
            </p>
            <div className="grid gap-3">
              {footerHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border border-[#e4e4de] bg-white px-4 py-4 text-sm leading-6 text-[#4f4f49]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e4e4de] py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8a82] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left">
          <p>Angren Game Circuit</p>
          <p>Турниры по PUBG MOBILE и MLBB</p>
        </div>
      </div>
    </footer>
  );
}
