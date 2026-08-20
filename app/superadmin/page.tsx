import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserManagementTable } from "./UserManagementTable";
import { PlanToggleButton } from "../admin/PlanToggleButton";

export default async function SuperAdminPanel() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/superadmin");
  if (session.user.role !== "SUPERADMIN") redirect("/");

  const [users, organizers] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, suspended: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.organizerProfile.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">👑 Superadmin</p>
          <h1 className="text-xl font-medium">Accesos y suscripciones</h1>
        </div>
        <Link href="/admin" className="text-sm text-accent">
          Panel de admin →
        </Link>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm text-secondary">
          Usuarios ({users.length}{users.length === 50 ? "+" : ""})
        </p>
        <UserManagementTable initialUsers={users} />
      </div>

      <div className="mt-10">
        <p className="mb-3 text-sm text-secondary">Suscripciones (plan de cada organizador)</p>
        <div className="flex flex-col gap-2">
          {organizers.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between rounded-md bg-surface-1 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{org.orgName}</p>
                <p className="truncate text-xs text-muted">
                  {org.user.email}
                  {org.planExpiresAt &&
                    ` · vence ${org.planExpiresAt.toLocaleDateString("es-AR")}`}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    org.plan === "PRO" ? "bg-success text-success" : "bg-surface-2 text-muted"
                  }`}
                >
                  {org.plan}
                </span>
                <PlanToggleButton organizerId={org.id} currentPlan={org.plan} />
              </div>
            </div>
          ))}
          {organizers.length === 0 && (
            <p className="text-sm text-muted">Todavía no hay organizadores.</p>
          )}
        </div>
      </div>
    </main>
  );
}
