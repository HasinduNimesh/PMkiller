"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProjectError({
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
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <h1 className="font-display text-2xl font-semibold">Project page error</h1>
      <p className="text-sm opacity-60">
        This project view failed to load. Retry, or return to the project list.
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Try again
        </button>
        <Link href="/projects" className="btn btn-ghost btn-sm">
          All projects
        </Link>
      </div>
    </div>
  );
}
