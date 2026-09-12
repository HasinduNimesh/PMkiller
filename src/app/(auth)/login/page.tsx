"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await loginAction(formData);
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
      </fieldset>

      {error && (
        <div role="alert" className="alert alert-error rounded-xl text-sm">
          <span>{error}</span>
        </div>
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
