import Link from "next/link";
import { beginGoogleAuthAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { getI18n } from "@/lib/i18n-server";
import { getMessageFromSearchParams } from "@/lib/messages";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const { locale } = await getI18n();
  const copy =
    locale === "ru"
      ? {
          kicker: "Создать профиль",
          titleLines: ["Начните с одного", "аккуратного шага"],
          subtitle:
            "Регистрация стала проще: сначала быстрый вход через Google, а если он не нужен, на странице входа доступна короткая форма по email.",
          cardTitle: "Как это работает",
          cardCopy:
            "После первого входа мы автоматически создадим профиль, а заполнить остальное можно будет уже внутри аккаунта.",
          googleLabel: "Регистрация через Google",
          emailLabel: "Создать профиль по email",
          step1: "Войдите через Google или откройте быструю регистрацию по email.",
          step2: "Профиль создастся автоматически без выбора страны и игр на старте.",
          step3: "После входа вы сразу попадёте в профиль и сможете закончить настройку позже.",
          loginLead: "Уже есть аккаунт?",
          loginAction: "Войти",
        }
      : {
          kicker: "Create profile",
          titleLines: ["Start with", "one clean step"],
          subtitle:
            "Registration is now simpler: begin with Google, and keep a short email fallback on the login page if you prefer.",
          cardTitle: "How it works",
          cardCopy:
            "After the first sign-in we create the profile automatically, and you can fill in the rest later inside the account.",
          googleLabel: "Continue with Google",
          emailLabel: "Create profile with email",
          step1: "Start with Google or open the quick email registration form.",
          step2: "The profile is created without asking for country and games upfront.",
          step3: "After sign-in you land in the profile and can finish setup later.",
          loginLead: "Already have an account?",
          loginAction: "Log in",
        };

  return (
    <div className="auth-shell auth-shell--focus">
      <section className="auth-center">
        <div className="auth-center__intro">
          <span className="auth-kicker">{copy.kicker}</span>
          <h1 className="auth-focus-title auth-focus-title--register">
            <span className="auth-focus-title__line">{copy.titleLines[0]}</span>
            <span className="auth-focus-title__line">{copy.titleLines[1]}</span>
          </h1>
          <p className="auth-focus-copy">{copy.subtitle}</p>
        </div>

        <article className="auth-card auth-card--hub">
          <div className="auth-card-header auth-card-header--compact">
            <h2 className="auth-card-title">{copy.cardTitle}</h2>
            <p className="auth-card-copy">{copy.cardCopy}</p>
          </div>

          {message ? (
            <div className="auth-message">
              <FlashMessage message={message} />
            </div>
          ) : null}

          <div className="auth-story-card">
            <p className="auth-story-card__eyebrow">{copy.cardTitle}</p>
            <p className="auth-story-card__copy">{copy.cardCopy}</p>
          </div>

          <form action={beginGoogleAuthAction} className="auth-social-form">
            <input type="hidden" name="intent" value="register" />
            <input type="hidden" name="returnTo" value="/profile" />
            <input type="hidden" name="sourcePath" value="/register" />
            <button type="submit" className="auth-social-button">
              <span className="auth-social-button__mark" aria-hidden>
                G
              </span>
              <span>{copy.googleLabel}</span>
            </button>
          </form>

          <Link href="/login?mode=register" className="button-secondary auth-secondary-link">
            {copy.emailLabel}
          </Link>

          <div className="auth-step-list">
            <article className="auth-step">
              <span className="auth-step__index">1</span>
              <p>{copy.step1}</p>
            </article>
            <article className="auth-step">
              <span className="auth-step__index">2</span>
              <p>{copy.step2}</p>
            </article>
            <article className="auth-step">
              <span className="auth-step__index">3</span>
              <p>{copy.step3}</p>
            </article>
          </div>

          <div className="auth-card-footer auth-card-footer--stack">
            <p className="auth-switch">{copy.loginLead}</p>
            <Link href="/login" className="auth-switch-link">
              {copy.loginAction}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
