import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";

export default async function NotFoundPage() {
  const { dict } = await getI18n();
  const copy = dict.notFound;

  return (
    <section className="hero-banner mx-auto flex max-w-3xl flex-col items-start gap-4">
      <p className="eyebrow">404</p>
      <h1 className="section-heading">{copy.title}</h1>
      <p className="section-copy">{copy.copy}</p>
      <Link href="/" className="button-secondary">
        {copy.home}
      </Link>
    </section>
  );
}
