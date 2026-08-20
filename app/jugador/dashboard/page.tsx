import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GalaxianBackground } from "@/app/components/GalaxianBackground";
import { PushNotificationOptIn } from "@/app/components/PushNotificationOptIn";
import { SignOutButton } from "@/app/components/SignOutButton";
import Link from "next/link";

export default async function PlayerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/jugador/dashboard");

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      registrations: {
        include: { tournament: { include: { game: true } }, payment: true },
        orderBy: { createdAt: "desc" },
      },
      achievements: true,
    },
  });

  if (!playerProfile) redirect("/jugador/perfil/nuevo");

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const upcoming = playerProfile.registrations.filter((r) =>
    ["REGISTRATION_OPEN", "PUBLISHED"].includes(r.tournament.status)
  );
  const active = playerProfile.registrations.filter(
    (r) => r.tournament.status === "IN_PROGRESS"
  );
  const finished = playerProfile.registrations.filter(
    (r) => r.tournament.status === "FINISHED"
  );

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, readAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Un lindo puente entre las dos features: si vino de armar torneos entre
  // amigos, se lo mostramos acá para empujarlo hacia el flujo pago —
  // exactamente el embudo que definimos al diseñar Modo Amigos.
  const recentFriendTournaments = await prisma.friendTournament.findMany({
    where: { hostUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { game: true },
  });

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-8">
      <GalaxianBackground className="opacity-30" />

      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-secondary">Hola, {session.user.name}</p>
            <h1 className="text-xl font-medium">Rating: {playerProfile.eloRating}</h1>
            <div className="mt-1">
              <PushNotificationOptIn />
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <div className="flex gap-2">
              <Link
                href="/torneos"
                className="rounded-md bg-primary px-4 py-2 text-sm text-white"
              >
                Buscar torneos
              </Link>
              <Link
                href={organizerProfile ? "/organizador/dashboard" : "/organizador/perfil/nuevo"}
                className="rounded-md border border-strong px-4 py-2 text-sm text-accent"
              >
                {organizerProfile ? "Mi panel de organizador" : "Crear torneo"}
              </Link>
            </div>
            <div className="flex gap-3 text-xs">
              <Link href="/perfil" className="text-secondary">
                Mi perfil
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        {!organizerProfile && (
          <div className="mt-4 rounded-xl border border-dashed border-strong p-4 text-sm">
            <p className="font-medium">¿Querés organizar tu propio torneo?</p>
            <p className="mt-1 text-secondary">
              Cualquier jugador puede convertirse en organizador — no perdés tu cuenta ni tu
              perfil de jugador, simplemente sumás el de organizador.
            </p>
            <Link
              href="/organizador/perfil/nuevo"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              Crear mi primer torneo
            </Link>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-md bg-surface-1 p-3 text-sm">
                {typeof n.payload === "object" && n.payload && "message" in n.payload
                  ? String((n.payload as { message: string }).message)
                  : n.type}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-1 p-4 text-center">
            <p className="text-xs text-muted">Activos</p>
            <p className="mt-1 text-xl font-medium">{active.length}</p>
          </div>
          <div className="rounded-xl bg-surface-1 p-4 text-center">
            <p className="text-xs text-muted">Próximos</p>
            <p className="mt-1 text-xl font-medium">{upcoming.length}</p>
          </div>
          <div className="rounded-xl bg-surface-1 p-4 text-center">
            <p className="text-xs text-muted">Logros</p>
            <p className="mt-1 text-xl font-medium">{playerProfile.achievements.length}</p>
          </div>
        </div>

        {active.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-secondary">Jugando ahora</p>
            <div className="flex flex-col gap-2">
              {active.map((r) => (
                <Link
                  key={r.id}
                  href={`/torneos/${r.tournament.id}`}
                  className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
                >
                  <div>
                    <p className="font-medium">{r.tournament.name}</p>
                    <p className="text-xs text-muted">{r.tournament.game.name}</p>
                  </div>
                  <span className="rounded-md bg-[var(--bg-danger)] px-2 py-0.5 text-xs text-[var(--text-danger)]">
                    En vivo
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="mb-3 text-sm text-secondary">Próximos torneos</p>
          <div className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <Link
                key={r.id}
                href={`/torneos/${r.tournament.id}`}
                className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
              >
                <p className="font-medium">{r.tournament.name}</p>
                <span className="text-xs text-secondary">
                  {r.payment?.status === "PENDING" ? "Pago pendiente" : "Confirmado"}
                </span>
              </Link>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-muted">No tenés torneos próximos.</p>
            )}
          </div>
        </div>

        {recentFriendTournaments.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-secondary">Tus torneos entre amigos</p>
            <div className="flex flex-col gap-2">
              {recentFriendTournaments.map((ft) => (
                <div
                  key={ft.id}
                  className="flex items-center justify-between rounded-md bg-surface-1 p-3"
                >
                  <p className="text-sm">{ft.game.name} · {ft.mode}</p>
                  <Link href={`/amigos/${ft.id}`} className="text-sm text-accent">
                    Ver
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-secondary">
              ¿Y si el próximo lo hacés con inscripción y premio de verdad?{" "}
              <Link href="/organizador/torneos/nuevo" className="text-accent">
                Armar torneo real
              </Link>
            </p>
          </div>
        )}

        {finished.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-secondary">Historial reciente</p>
            <div className="flex flex-col gap-2">
              {finished.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/torneos/${r.tournament.id}`}
                  className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
                >
                  <p className="text-sm">{r.tournament.name}</p>
                  <span className="text-xs text-muted">Finalizado</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
