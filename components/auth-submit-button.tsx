"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`button-primary auth-submit w-full ${pending ? "auth-submit--pending" : ""}`}
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
