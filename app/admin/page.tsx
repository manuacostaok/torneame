import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlanToggleButton } from "./PlanToggleButton";

export default async function AdminPanel() {
  const session = await auth();

  // Guard doble, mismo criterio que en el resto de rutas sensibles del
  // proyecto: ni siquiera se arma la query si no sos admin, no alcanza
  // con que el server action también lo valide.
  if (!session?.user) redirect("/login?redirect=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [totalPlayers, totalOrganizers, organizers, recentPayments, pendingProducts] =
    await Promise.all([
      prisma.playerProfile.count(),
      prisma.organizerProfile.count(),
      prisma.organizerProfile.findMany({
        include: { user: true, _count: { select: { tournaments: true, followers: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { status: "APPROVED" },
        include: {
          registration: {
            include: {
              player: { include: { user: true } },
              tournament: { include: { organizer: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.productOrder.count({ where: { status: "PENDING" } }),
    ]);

  const totalCommission = recentPayments.reduce((sum, p) => sum + Number(p.commissionAmount), 0);
  const totalRecaudado = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-medium">Panel de administrador</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-1 p-4">
          <p className="text-xs text-muted">Jugadores</p>
          <p className="mt-1 text-xl font-medium">{totalPlayers}</p>
        </div>
        <div className="rounded-xl bg-surface-1 p-4">
          <p className="text-xs text-muted">Organizadores</p>
          <p className="mt-1 text-xl font-medium">{totalOrganizers}</p>
        </div>
        <div className="rounded-xl bg-surface-1 p-4">
          <p className="text-xs text-muted">Recaudado (últimos 30 pagos)</p>
          <p className="mt-1 text-xl font-medium text-warning">
            ${totalRecaudado.toLocaleString("es-AR")}
          </p>
        </div>
        <div className="rounded-xl bg-surface-1 p-4">
          <p className="text-xs text-muted">Nuestra comisión</p>
          <p className="mt-1 text-xl font-medium text-warning">
            ${totalCommission.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm text-secondary">Organizadores</p>
        <div className="flex flex-col gap-2">
          {organizers.map((org) => (
            <div key={org.id} className="flex items-center justify-between rounded-md bg-surface-1 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {org.orgName} {org.verified && "✓"}
                </p>
                <p className="text-xs text-muted">
                  {org.user.email} · {org._count.tournaments} torneos · {org._count.followers} seguidores
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
          {organizers.length === 0 && <p className="text-sm text-muted">Todavía no hay organizadores.</p>}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm text-secondary">Pagos recientes (últimos 30)</p>
        <div className="flex flex-col gap-2">
          {recentPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md bg-surface-1 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate">
                  {p.registration.player.user.name} → {p.registration.tournament.name}
                </p>
                <p className="text-xs text-muted">{p.registration.tournament.organizer.orgName}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p>${Number(p.amount).toLocaleString("es-AR")}</p>
                <p className="text-xs text-muted">
                  comisión ${Number(p.commissionAmount).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          ))}
          {recentPayments.length === 0 && <p className="text-sm text-muted">Todavía no hay pagos aprobados.</p>}
        </div>
      </div>

      {pendingProducts > 0 && (
        <p className="mt-6 text-sm text-secondary">
          Hay {pendingProducts} pedido{pendingProducts === 1 ? "" : "s"} de la tienda pendiente
          {pendingProducts === 1 ? "" : "s"} de confirmar.
        </p>
      )}
    </main>
  );
}
