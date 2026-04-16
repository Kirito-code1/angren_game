"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
  variant = "primary",
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "emerald";
}) {
  const { pending } = useFormStatus();
  const variantClass = variant === "emerald" ? "auth-submit--emerald" : "";

  return (
    <button
      type="submit"
      className={`button-primary auth-submit w-full ${variantClass} ${pending ? "auth-submit--pending" : ""}`}
      aria-disabled={pending}
      disabled={pending}
    >
      <span className="auth-submit__content">
        {pending ? <span className="auth-submit__spinner" aria-hidden /> : null}
        <span>{pending ? pendingLabel : idleLabel}</span>
      </span>
    </button>
  );
}
