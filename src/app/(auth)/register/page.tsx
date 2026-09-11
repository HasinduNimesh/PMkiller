"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <form
        className="card-body"
        action={(formData) => {
          startTransition(async () => {
            const result = await registerAction(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <h2 className="card-title">Create organization</h2>
        <p className="text-sm opacity-60">You become the Admin for the new org.</p>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Your name</legend>
          <input name="name" required className="input w-full" />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Work email</legend>
          <input name="email" type="email" required className="input w-full" />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Organization name</legend>
          <input name="organizationName" required className="input w-full" />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Password</legend>
          <input name="password" type="password" required minLength={6} className="input w-full" />
        </fieldset>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="card-actions mt-2">
          <button type="submit" disabled={pending} className="btn btn-primary btn-block">
            {pending ? <span className="loading loading-spinner loading-sm" /> : null}
            {pending ? "Creating…" : "Create & continue"}
          </button>
        </div>

        <p className="mt-2 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="link link-primary">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
