import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-base-100/50 backdrop-blur-md shadow-[0_0_32px_color-mix(in_oklab,var(--color-primary)_8%,transparent)] px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-base-content/55">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-5 rounded-xl">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
