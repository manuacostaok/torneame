import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GalaxianBackground } from "@/app/components/GalaxianBackground";
import { suggestBestTiming, suggestBestFormat } from "@/lib/insights";
import { SignOutButton } from "@/app/components/SignOutButton";
import { PaymentAliasEditor } from "./PaymentAliasEditor";
import Link from "next/link";

export default async function OrganizerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/organizador/dashboard");
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") redirect("/");

  const organizer = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      tournaments: {
        include: {
          _count: { select: { registrations: true } },
          registrations: { include: { payment: true } },
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!organizer) redirect("/organizador/perfil/nuevo");

  const activeTournaments = organizer.tournaments.filter((t) =>
    ["REGISTRATION_OPEN", "IN_PROGRESS"].includes(t.status)
  );
  const draftTournaments = organizer.tournaments.filter((t) => t.status === "DRAFT");

  const totalRecaudado = organizer.tournaments.reduce((sum, t) => {
    const approved = t.registrations.filter((r) => r.payment?.status === "APPROVED");
    return sum + approved.reduce((s, r) => s + Number(r.payment?.amount ?? 0), 0);
  }, 0);

  const pendingPayments = organizer.tournaments.flatMap((t) =>
    t.registrations.filter((r) => r.payment?.status === "PENDING")
  );

  const timingSuggestion = suggestBestTiming(
    organizer.tournaments.map((t) => ({
      startsAt: t.startsAt,
      registrationCount: t._count.registrations,
      format: t.format,
      maxPlayers: t.maxPlayers,
    }))
  );
  const formatSuggestion = suggestBestFormat(
    organizer.tournaments.map((t) => ({
      startsAt: t.startsAt,
      registrationCount: t._count.registrations,
      format: t.format,
      maxPlayers: t.maxPlayers,
    }))
  );

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-8">
      {/* Mismo lenguaje visual que el login (naves estilo Galaxian), pero
          más tenue acá — este es un espacio de trabajo, no una pantalla
          de bienvenida, el movimiento no puede competir con los números */}
      <GalaxianBackground className="opacity-30" />

      <div className="relative mx-auto max-w-4xl">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-secondary">Hola de nuevo</p>
            <h1 className="text-xl font-medium">{organizer.orgName}</h1>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <Link
              href="/organizador/torneos/nuevo"
              className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              + Crear torneo
            </Link>
            <div className="flex gap-3 text-xs">
              <Link href="/perfil" className="text-secondary">
                Mi perfil
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-1 p-4">
            <p className="text-xs text-muted">Recaudado total</p>
            <p className="mt-1 text-2xl font-medium text-[var(--text-warning)]">
              ${totalRecaudado.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="rounded-xl bg-surface-1 p-4">
            <p className="text-xs text-muted">Torneos activos</p>
            <p className="mt-1 text-2xl font-medium">{activeTournaments.length}</p>
          </div>
          <Link
            href="/organizador/pagos"
            className="rounded-xl bg-surface-1 p-4 transition hover:bg-surface-2"
          >
            <p className="text-xs text-muted">Pagos pendientes</p>
            <p className="mt-1 text-2xl font-medium">{pendingPayments.length}</p>
            {pendingPayments.length > 0 && (
              <p className="mt-1 text-xs text-accent">Revisar comprobantes →</p>
            )}
          </Link>
        </div>

        <PaymentAliasEditor currentAlias={organizer.paymentAlias ?? ""} />

        {(timingSuggestion || formatSuggestion) && (
          <div className="mt-4 rounded-xl bg-surface-1 p-4">
            <p className="text-xs text-muted">Basado en tus propios torneos anteriores</p>
            {timingSuggestion && (
              <p className="mt-1 text-sm">
                Tus torneos de <span className="font-medium">{timingSuggestion.dayOfWeek}</span> a
                las <span className="font-medium">{timingSuggestion.hour}hs</span> promedian{" "}
                {timingSuggestion.avgRegistrations} inscriptos — mejor que el resto de tus
                horarios.
              </p>
            )}
            {formatSuggestion && (
              <p className="mt-1 text-sm text-secondary">
                El formato que más se te llena es {formatSuggestion.replace("_", " ").toLowerCase()}.
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          <p className="mb-3 text-sm text-secondary">Torneos activos</p>
          <div className="flex flex-col gap-2">
            {activeTournaments.map((t) => (
              <Link
                key={t.id}
                href={`/torneos/${t.id}`}
                className="flex items-center justify-between rounded-md bg-surface-1 p-3 transition hover:bg-surface-2"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-secondary">
                    {t._count.registrations}/{t.maxPlayers} inscriptos
                  </p>
                </div>
                <span className="text-xs text-secondary">
                  {t.status === "IN_PROGRESS" ? "En vivo" : "Inscripción abierta"}
                </span>
              </Link>
            ))}
            {activeTournaments.length === 0 && (
              <p className="text-sm text-muted">No tenés torneos activos ahora.</p>
            )}
          </div>
        </div>

        {draftTournaments.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-secondary">Borradores</p>
            <div className="flex flex-col gap-2">
              {draftTournaments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md bg-surface-1 p-3"
                >
                  <p className="font-medium">{t.name}</p>
                  <Link href={`/torneos/${t.id}/editar`} className="text-sm text-accent">
                    Completar y publicar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
