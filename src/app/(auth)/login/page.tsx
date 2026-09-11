"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <form
        className="card-body"
        action={(formData) => {
          startTransition(async () => {
            const result = await loginAction(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <h2 className="card-title">Sign in</h2>
        <p className="text-sm opacity-60">Use your company account.</p>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Email</legend>
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="input w-full"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Password</legend>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="input w-full"
          />
        </fieldset>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="card-actions mt-2">
          <button type="submit" disabled={pending} className="btn btn-primary btn-block">
            {pending ? <span className="loading loading-spinner loading-sm" /> : null}
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p className="mt-2 text-center text-sm">
          New here?{" "}
          <Link href="/register" className="link link-primary">
            Create organization
          </Link>
        </p>
      </form>
    </div>
  );
}
