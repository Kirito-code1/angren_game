import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="hero-banner mx-auto flex max-w-3xl flex-col items-start gap-4">
      <p className="eyebrow">404</p>
      <h1 className="section-heading">Страница не найдена</h1>
      <p className="section-copy">
        Проверьте ссылку или вернитесь на главную, чтобы продолжить поиск турниров, команд и
        текущих событий.
      </p>
      <Link href="/" className="button-secondary">
        На главную
      </Link>
    </section>
  );
}
