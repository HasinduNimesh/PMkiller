import { verifyEmailAction } from "@/app/actions/auth";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <div className="panel-body space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Invalid link</h2>
        <p className="text-sm text-base-content/60">
          This verification link is missing parameters. Request a new one from the sign-in page.
        </p>
        <Link href="/login" className="btn btn-primary btn-block rounded-xl">
          Back to sign in
        </Link>
      </div>
    );
  }

  const result = await verifyEmailAction(email, token);

  if (!result.ok) {
    return (
      <div className="panel-body space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Could not verify</h2>
        <div role="alert" className="callout callout-error">
          <span>{result.error}</span>
        </div>
        <Link href="/check-email" className="btn btn-primary btn-block rounded-xl">
          Resend verification
        </Link>
      </div>
    );
  }

  return (
    <div className="panel-body space-y-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">Email verified</h2>
      <p className="text-sm text-base-content/60">
        Your account is active. You can sign in now.
      </p>
      <Link href="/login" className="btn btn-primary btn-block rounded-xl">
        Sign in
      </Link>
    </div>
  );
}
