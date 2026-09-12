"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { loginAction, resendVerificationAction } from "@/app/actions/auth";

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    params.get("reset") === "1" ? "Password updated. You can sign in." : null,
  );
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          setInfo(null);
          const result = await loginAction(formData);
          if (result?.needsVerification && result.email) {
            setNeedsVerification(result.email);
            setError(result.error ?? null);
            return;
          }
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-base-content/55">Use your company account.</p>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          defaultValue={needsVerification ?? ""}
          className="input w-full rounded-xl"
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Password</legend>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="input w-full rounded-xl"
        />
        <p className="mt-1 text-right text-xs">
          <Link href="/forgot-password" className="link link-primary">
            Forgot password?
          </Link>
        </p>
      </fieldset>

      {info && (
        <div role="status" className="callout callout-info">
          <span>{info}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="callout callout-error">
          <span>{error}</span>
        </div>
      )}

      {needsVerification && (
        <button
          type="button"
          className="btn btn-outline btn-block rounded-xl"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("email", needsVerification);
            startTransition(async () => {
              const result = await resendVerificationAction(fd);
              if (result && "error" in result && result.error) setError(result.error);
              else if (result && "message" in result) {
                setInfo(result.message ?? null);
                setError(null);
              }
            });
          }}
        >
          Resend verification email
        </button>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block rounded-xl">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-base-content/60">
        New here?{" "}
        <Link href="/register" className="link link-primary">
          Create organization
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="panel-body">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
