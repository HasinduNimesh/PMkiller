import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.id && session.user.organizationId) {
    redirect("/dashboard");
  }

  return (
    <div className="app-canvas relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-4xl font-semibold tracking-tight">
            Proj<span className="text-primary">Manager</span>
          </Link>
          <p className="mt-2 text-sm text-base-content/55">
            Track deadlines, severity, and critical path schedules.
          </p>
        </div>
        <div className="panel">{children}</div>
      </div>
    </div>
  );
}
