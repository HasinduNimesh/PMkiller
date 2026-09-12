"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const result = await forgotPasswordAction(formData);
          if (result?.error) setError(result.error);
          else if (result?.message) setMessage(result.message);
        });
      }}
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Forgot password</h2>
        <p className="mt-1 text-sm text-base-content/55">
          We will email you a link to choose a new password.
        </p>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="input w-full rounded-xl"
        />
      </fieldset>

      {error && (
        <div role="alert" className="callout callout-error">
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div role="status" className="callout callout-info">
          <span>{message}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block rounded-xl">
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-base-content/60">
        <Link href="/login" className="link link-primary">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
