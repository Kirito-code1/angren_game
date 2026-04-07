import Link from "next/link";
import { registerAction } from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { FlashMessage } from "@/components/flash-message";
import { countryLabels } from "@/lib/catalog";
import { getMessageFromSearchParams } from "@/lib/messages";
import { readStore } from "@/lib/store";

type SearchParams = Record<string, string | string[] | undefined>;

const registerBenefits = [
  {
    title: "Личный профиль",
    copy: "Храните свои данные, выбранные игры и историю участия в одном месте.",
  },
  {
    title: "Команды и заявки",
    copy: "Вступайте в команду, подавайте заявки и следите за подтверждением.",
  },
  {
    title: "Матчи и сетка",
    copy: "Получайте быстрый доступ к расписанию, матчам и результатам турниров.",
  },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const store = await readStore();

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <aside className="auth-lead">
          <p className="eyebrow">Регистрация</p>
          <h1 className="auth-title">Создайте аккаунт</h1>
          <p className="auth-subtitle">
            После регистрации можно вступать в команды, подавать заявки и следить за матчами.
          </p>

          <div className="auth-benefits">
            {registerBenefits.map((item) => (
              <article key={item.title} className="auth-benefit">
                <h2 className="auth-benefit-title">{item.title}</h2>
                <p className="auth-benefit-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </aside>

        <article className="auth-card auth-card--form">
          <div className="auth-card-header">
            <p className="eyebrow">Новый аккаунт</p>
            <h2 className="auth-card-title">Регистрация игрока</h2>
            <p className="auth-card-copy">
              Заполните форму один раз. Остальное сможете поменять позже в профиле.
            </p>
          </div>

          {message ? (
            <div className="auth-message">
              <FlashMessage message={message} />
            </div>
          ) : null}

          <form action={registerAction} className="auth-form">
            <input type="hidden" name="returnTo" value="/register" />

            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-label">Никнейм</span>
                <input name="nickname" required autoComplete="nickname" placeholder="GamerTag" />
              </label>
              <label className="auth-field">
                <span className="auth-label">Страна</span>
                <select name="country" required defaultValue="">
                  <option value="">Выберите страну</option>
                  {Object.entries(countryLabels).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-label">Пароль</span>
                <input
                  type="password"
                  name="password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                />
              </label>
              <label className="auth-field">
                <span className="auth-label">Повтор пароля</span>
                <input
                  type="password"
                  name="passwordConfirm"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="Повторите пароль"
                />
              </label>
            </div>

            <fieldset className="auth-fieldset">
              <legend className="auth-label">Игры</legend>
              <p className="auth-hint">Выберите игры, которые вам интересны.</p>
              <div className="auth-grid-two">
                {store.disciplines.map((discipline) => (
                  <label key={discipline.slug} className="auth-option">
                    <input
                      type="checkbox"
                      name="disciplines"
                      value={discipline.slug}
                      defaultChecked={discipline.slug === "mobile-legends"}
                      className="peer sr-only"
                    />
                    <span className="auth-option-card">
                      <span className="auth-option-icon">{discipline.icon}</span>
                      <span className="space-y-1">
                        <span className="block font-semibold leading-none text-[#171717]">
                          {discipline.shortTitle}
                        </span>
                        <span className="block text-xs leading-5 text-[#77776f]">
                          {discipline.formats.join(" · ")}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <AuthSubmitButton idleLabel="Создать аккаунт" pendingLabel="Создаём и входим..." />
          </form>

          <div className="auth-card-footer">
            <p className="auth-switch">Уже есть аккаунт?</p>
            <Link href="/login" className="auth-switch-link">
              Войти
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
