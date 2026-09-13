import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { RoleSelect } from "@/components/role-select";
import { InviteUserForm } from "@/components/invite-user-form";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { UserAvatar } from "@/components/user-avatar";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) return null;
  if (!canManageUsers(session.user.role)) redirect("/dashboard");

  const members = await prisma.orgMember.findMany({
    where: { organizationId: session.user.organizationId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Users & roles</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Org admins can add teammates after registering the company. Roles: Admin, PM, Member,
          Viewer.
        </p>
      </div>

      <InviteUserForm />

      <div className="panel">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={m.user.name}
                        image={m.user.image}
                        size={32}
                        rounded="full"
                      />
                      <span className="font-medium">{m.user.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="text-base-content/70">{m.user.email}</td>
                  <td>
                    <RoleSelect
                      userId={m.userId}
                      role={m.role}
                      disabled={m.userId === session.user.id}
                    />
                  </td>
                  <td>
                    {m.userId !== session.user.id && (
                      <RemoveMemberButton userId={m.userId} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
