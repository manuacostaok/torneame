import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";
import { RegisterButton } from "./RegisterButton";
import { CommentsSection } from "./CommentsSection";
import { BracketView } from "./BracketView";
import { SponsorsSection } from "./SponsorsSection";
import { calculatePrizePool } from "@/lib/prizePool";
import { notFound } from "next/navigation";

export const revalidate = 30;

export default async function TournamentPage({ params }: { params: { slug: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.slug },
    include: {
      game: true,
      organizer: true,
      _count: { select: { registrations: true } },
      bracket: true,
      comments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { name: true, avatarUrl: true } } },
      },
      sponsors: true,
    },
  });

  if (!tournament) notFound();

  const session = await auth();

  const currentPrize = calculatePrizePool(
    Number(tournament.prizePoolBase),
    tournament._count.registrations,
    tournament.prizePoolDynamicRule
  );
  const isPrizeBoosted = currentPrize > Number(tournament.prizePoolBase);

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-8">
      <AnimatedBackground />

      <div className="mx-auto max-w-3xl">
        {/* Encabezado del torneo — reemplaza al flyer de Canva */}
        <div className="rounded-xl bg-surface-1 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-sm text-secondary">
                {tournament.game.name} &middot;{" "}
                {tournament.locationType === "PRESENCIAL" ? "Presencial" : "Online"}
              </p>
              <h1 className="text-xl font-medium sm:text-2xl">{tournament.name}</h1>
              {tournament.venueAddress && (
                <p className="mt-1 text-sm text-secondary">{tournament.venueAddress}</p>
              )}
              <p className="mt-1 text-sm text-secondary">
                Organiza{" "}
                <a href={`/organizadores/${tournament.organizer.slug}`} className="underline">
                  {tournament.organizer.orgName}
                </a>
              </p>
            </div>
            <RegisterButton
              tournamentId={tournament.id}
              isLoggedIn={!!session?.user}
              spotsLeft={tournament.maxPlayers - tournament._count.registrations}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md bg-surface-2 p-3">
              <p className="text-xs text-muted">Premio total</p>
              <p className="font-medium text-[var(--text-warning)]">${currentPrize.toLocaleString("es-AR")}</p>
              {isPrizeBoosted && (
                <span className="block text-xs text-[var(--text-success)]">↑ escalando</span>
              )}
            </div>
            <div className="rounded-md bg-surface-2 p-3">
              <p className="text-xs text-muted">Cupos</p>
              <p className="font-medium">
                {tournament._count.registrations}/{tournament.maxPlayers}
              </p>
            </div>
            <div className="rounded-md bg-surface-2 p-3">
              <p className="text-xs text-muted">Inscripción</p>
              <p className="font-medium">
                {Number(tournament.entryFee) === 0
                  ? "Gratis"
                  : `$${Number(tournament.entryFee).toLocaleString("es-AR")}`}
              </p>
            </div>
          </div>
        </div>

        {/* Bracket en vivo */}
        {tournament.bracket && (
          <div className="mt-6">
            <p className="mb-2 text-sm text-secondary">Bracket en vivo</p>
            <BracketView structureJson={tournament.bracket.structureJson} />
          </div>
        )}

        <SponsorsSection sponsors={tournament.sponsors} />

        {/* Comentarios / feedback — como pediste, para que jugadores y
            organizador puedan intercambiar antes/durante/después del torneo */}
        <div className="mt-8">
          <CommentsSection
            tournamentId={tournament.id}
            initialComments={tournament.comments}
            isLoggedIn={!!session?.user}
          />
        </div>

        {/* Marca blanca del plan PRO: el organizador FREE ayuda a que
            Torneame se difunda con cada torneo que publica (parte de la
            estrategia de crecimiento), el PRO paga justamente para sacarse
            esto de encima */}
        {tournament.organizer.plan !== "PRO" && (
          <p className="mt-10 text-center text-xs text-muted">
            Organizado con Torneame
          </p>
        )}
      </div>
    </main>
  );
}
