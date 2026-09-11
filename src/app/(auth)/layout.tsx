import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content w-full max-w-md flex-col px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Proj<span className="text-primary">Manager</span>
          </h1>
          <p className="py-2 text-sm text-base-content/60">
            Track deadlines, severity, and critical path schedules.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
