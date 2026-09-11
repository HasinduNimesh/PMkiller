"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm opacity-60">
        An unexpected error occurred in the app. You can try again, or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="font-mono text-xs opacity-40">Digest: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Try again
        </button>
        <a href="/dashboard" className="btn btn-ghost btn-sm">
          Dashboard
        </a>
      </div>
    </div>
  );
}
