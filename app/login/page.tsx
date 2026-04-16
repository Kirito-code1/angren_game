import Link from "next/link";
import { beginGoogleAuthAction, loginAction, registerAction } from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { FlashMessage } from "@/components/flash-message";
import { getI18n } from "@/lib/i18n-server";
import { getMessageFromSearchParams } from "@/lib/messages";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const message = getMessageFromSearchParams(resolvedParams);
  const mode = resolvedParams.mode === "register" ? "register" : "login";
  const { locale } = await getI18n();
  const isRegisterMode = mode === "register";
  const sourcePath = isRegisterMode ? "/login?mode=register" : "/login";
  const switchHref = isRegisterMode ? "/login" : "/login?mode=register";
  const authCopy =
    locale === "ru"
      ? {
          kicker: isRegisterMode ? "Создать профиль" : "С возвращением!",
          title: isRegisterMode ? "Создайте аккаунт без длинной анкеты" : "Войдите и продолжайте играть",
          subtitle: isRegisterMode
            ? "Оставьте только ник, email и пароль. Остальное можно настроить уже после входа."
            : "Откройте профиль, свои турниры и команду с одной страницы без лишних переходов.",
          cardTitle: isRegisterMode ? "Регистрация" : "Вход",
          cardCopy: isRegisterMode
            ? "Сначала можете попробовать Google, а ниже доступна быстрая регистрация по email."
            : "Сначала можете попробовать Google, а ниже доступен обычный вход по email и паролю.",
          googleLabel: isRegisterMode ? "Регистрация через Google" : "Войти через Google",
          divider: "или через email",
          nickname: "Никнейм",
          nicknamePlaceholder: "phenix_2222",
          emailLabel: "Email адрес",
          emailPlaceholder: "example@mail.com",
          passwordLabel: "Пароль",
          passwordPlaceholder: "Минимум 6 символов",
          passwordConfirmLabel: "Повторите пароль",
          passwordConfirmPlaceholder: "Повторите пароль",
          submit: isRegisterMode ? "Создать профиль" : "Войти в аккаунт",
          pending: isRegisterMode ? "Создаём профиль..." : "Входим...",
          switchLead: isRegisterMode ? "Уже есть аккаунт?" : "Впервые у нас?",
          switchAction: isRegisterMode ? "Войти" : "Создать профиль",
        }
      : {
          kicker: isRegisterMode ? "Create Profile" : "Welcome back",
          title: isRegisterMode ? "Create an account without a long form" : "Sign in and keep playing",
          subtitle: isRegisterMode
            ? "Leave only a nickname, email, and password. You can fill in the rest after you enter the app."
            : "Open your profile, your tournaments, and your team from one place without extra clicks.",
          cardTitle: isRegisterMode ? "Registration" : "Login",
          cardCopy: isRegisterMode
            ? "Try Google first, and keep the quick email registration below as a fallback."
            : "Try Google first, and keep the regular email and password sign-in below as a fallback.",
          googleLabel: isRegisterMode ? "Continue with Google" : "Sign in with Google",
          divider: "or with email",
          nickname: "Nickname",
          nicknamePlaceholder: "phenix_2222",
          emailLabel: "Email address",
          emailPlaceholder: "example@mail.com",
          passwordLabel: "Password",
          passwordPlaceholder: "Minimum 6 characters",
          passwordConfirmLabel: "Confirm password",
          passwordConfirmPlaceholder: "Repeat the password",
          submit: isRegisterMode ? "Create profile" : "Log in",
          pending: isRegisterMode ? "Creating profile..." : "Logging in...",
          switchLead: isRegisterMode ? "Already have an account?" : "New here?",
          switchAction: isRegisterMode ? "Log in" : "Create profile",
        };

  return (
    <div className="auth-shell auth-shell--focus">
      <section className="auth-center">
        <div className="auth-center__intro">
          <span className="auth-kicker">{authCopy.kicker}</span>
          <h1 className="auth-focus-title">{authCopy.title}</h1>
          <p className="auth-focus-copy">{authCopy.subtitle}</p>
        </div>

        <article className="auth-card auth-card--hub">
          <div className="auth-card-header auth-card-header--compact">
            <h2 className="auth-card-title">{authCopy.cardTitle}</h2>
            <p className="auth-card-copy">{authCopy.cardCopy}</p>
          </div>

          {message ? (
            <div className="auth-message">
              <FlashMessage message={message} />
            </div>
          ) : null}

          <form action={beginGoogleAuthAction} className="auth-social-form">
            <input type="hidden" name="intent" value={isRegisterMode ? "register" : "login"} />
            <input type="hidden" name="returnTo" value="/profile" />
            <input type="hidden" name="sourcePath" value={sourcePath} />
            <button type="submit" className="auth-social-button">
              <span className="auth-social-button__mark" aria-hidden>
                G
              </span>
              <span>{authCopy.googleLabel}</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>{authCopy.divider}</span>
          </div>

          <form action={isRegisterMode ? registerAction : loginAction} className="auth-form">
            <input type="hidden" name="returnTo" value={isRegisterMode ? sourcePath : "/profile"} />

            {isRegisterMode ? (
              <label className="auth-field">
                <span className="auth-label">{authCopy.nickname}</span>
                <input
                  name="nickname"
                  required
                  autoComplete="nickname"
                  placeholder={authCopy.nicknamePlaceholder}
                />
              </label>
            ) : null}

            <label className="auth-field">
              <span className="auth-label">{authCopy.emailLabel}</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder={authCopy.emailPlaceholder}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">{authCopy.passwordLabel}</span>
              <input
                type="password"
                name="password"
                minLength={isRegisterMode ? 6 : undefined}
                required
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                placeholder={authCopy.passwordPlaceholder}
              />
            </label>

            {isRegisterMode ? (
              <label className="auth-field">
                <span className="auth-label">{authCopy.passwordConfirmLabel}</span>
                <input
                  type="password"
                  name="passwordConfirm"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder={authCopy.passwordConfirmPlaceholder}
                />
              </label>
            ) : null}

            <AuthSubmitButton
              idleLabel={authCopy.submit}
              pendingLabel={authCopy.pending}
              variant="emerald"
            />
          </form>

          <div className="auth-card-footer auth-card-footer--stack">
            <p className="auth-switch">{authCopy.switchLead}</p>
            <Link href={switchHref} className="auth-switch-link">
              {authCopy.switchAction}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
