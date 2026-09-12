"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!email || !token) {
    return (
      <div className="panel-body space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Invalid reset link</h2>
        <p className="text-sm text-base-content/60">Request a new password reset email.</p>
        <Link href="/forgot-password" className="btn btn-primary btn-block rounded-xl">
          Forgot password
        </Link>
      </div>
    );
  }

  return (
    <form
      className="panel-body space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await resetPasswordAction(formData);
          if (result?.error) setError(result.error);
          else router.push("/login?reset=1");
        });
      }}
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Choose new password</h2>
        <p className="mt-1 text-sm text-base-content/55">For {email}</p>
      </div>

      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <fieldset className="fieldset">
        <legend className="fieldset-legend">New password</legend>
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
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="panel-body">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
