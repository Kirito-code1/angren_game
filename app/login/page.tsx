import Link from "next/link";
import { loginAction } from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { FlashMessage } from "@/components/flash-message";
import { getMessageFromSearchParams } from "@/lib/messages";

type SearchParams = Record<string, string | string[] | undefined>;

const loginBenefits = [
  {
    title: "Команда под рукой",
    copy: "Открывайте профиль, состав и статус своей команды без лишних переходов.",
  },
  {
    title: "Турниры и заявки",
    copy: "Быстро переходите к текущим турнирам и следите за регистрацией.",
  },
  {
    title: "Матчи и результаты",
    copy: "Смотрите сетку, статус матчей и последние результаты в одном месте.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <aside className="auth-lead">
          <p className="eyebrow">Вход</p>
          <h1 className="auth-title">Войти в аккаунт</h1>
          <p className="auth-subtitle">
            Откройте свой профиль, команду и все турниры, в которых вы участвуете.
          </p>

          <div className="auth-benefits">
            {loginBenefits.map((item) => (
              <article key={item.title} className="auth-benefit">
                <h2 className="auth-benefit-title">{item.title}</h2>
                <p className="auth-benefit-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </aside>

        <article className="auth-card auth-card--form">
          <div className="auth-card-header">
            <p className="eyebrow">Ваш аккаунт</p>
            <h2 className="auth-card-title">С возвращением</h2>
            <p className="auth-card-copy">Введите email и пароль, чтобы продолжить.</p>
          </div>

          {message ? (
            <div className="auth-message">
              <FlashMessage message={message} />
            </div>
          ) : null}

          <form action={loginAction} className="auth-form">
            <input type="hidden" name="returnTo" value="/profile" />
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
            <label className="auth-field">
              <span className="auth-label">Пароль</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Введите пароль"
              />
            </label>
            <AuthSubmitButton idleLabel="Войти в аккаунт" pendingLabel="Входим..." />
          </form>

          <div className="auth-card-footer">
            <p className="auth-switch">Нет аккаунта?</p>
            <Link href="/register" className="auth-switch-link">
              Создать профиль
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
