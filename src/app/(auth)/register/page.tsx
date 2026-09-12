"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await registerAction(formData);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Create organization</h2>
        <p className="mt-1 text-sm text-base-content/55">You become the Admin for the new org.</p>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Your name</legend>
        <input name="name" required className="input w-full rounded-xl" />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Work email</legend>
        <input name="email" type="email" required className="input w-full rounded-xl" />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Organization name</legend>
        <input name="organizationName" required className="input w-full rounded-xl" />
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
        <div role="alert" className="callout callout-error">
          <span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block rounded-xl">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? "Creating…" : "Create & continue"}
      </button>

      <p className="text-center text-sm text-base-content/60">
        Already have an account?{" "}
        <Link href="/login" className="link link-primary">
          Sign in
        </Link>
      </p>
    </form>
  );
}
