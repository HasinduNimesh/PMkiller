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
    <div className="flex flex-col items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-base-100 shadow-sm">
        <Icon className="h-5 w-5 text-base-content/50" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-base-content/60">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-4">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
