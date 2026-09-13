import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfileSettingsPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Profile settings</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Update your display name, photo, and password.
        </p>
      </div>

      <div className="panel">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email}
          image={user.image}
          role={session.user.role}
        />
      </div>
    </div>
  );
}
