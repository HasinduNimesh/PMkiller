"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { resendVerificationAction } from "@/app/actions/auth";

function CheckEmailForm() {
  const params = useSearchParams();
  const preset = params.get("email") ?? "";
  const [message, setMessage] = useState<string | null>(
    preset ? `We sent a verification link to ${preset}.` : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const result = await resendVerificationAction(formData);
          if (result && "error" in result && result.error) setError(result.error);
          else if (result && "message" in result) setMessage(result.message ?? null);
        });
      }}
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Check your email</h2>
        <p className="mt-1 text-sm text-base-content/55">
          Confirm your address to activate the account, then sign in.
        </p>
      </div>

      {message && (
        <div role="status" className="callout callout-info">
          <span>{message}</span>
        </div>
      )}

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          name="email"
          type="email"
          required
          defaultValue={preset}
          className="input w-full rounded-xl"
        />
      </fieldset>

      {error && (
        <div role="alert" className="callout callout-error">
          <span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block rounded-xl">
        {pending ? "Sending…" : "Resend verification email"}
      </button>

      <p className="text-center text-sm text-base-content/60">
        <Link href="/login" className="link link-primary">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="panel-body">Loading…</div>}>
      <CheckEmailForm />
    </Suspense>
  );
}
