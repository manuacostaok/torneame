import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublishButton } from "./PublishButton";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/torneos/${slug}/editar`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: slug },
    include: { organizer: true, game: true },
  });
  if (!tournament) notFound();
  if (tournament.organizer.userId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/organizador/dashboard");
  }

  if (tournament.status !== "DRAFT") redirect(`/torneos/${tournament.id}`);

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium">Publicar torneo</h1>
      <p className="mt-1 text-sm text-secondary">
        Revisá los datos y publicalo para abrir la inscripción.
      </p>

      <div className="mt-6 rounded-xl bg-surface-1 p-4 text-sm">
        <p className="font-medium">{tournament.name}</p>
        <p className="mt-1 text-secondary">
          {tournament.game.name} &middot; {tournament.mode} &middot;{" "}
          {tournament.locationType === "PRESENCIAL" ? "Presencial" : "Online"}
        </p>
        <p className="mt-1 text-secondary">
          Cupo: {tournament.maxPlayers} &middot; Inscripción: $
          {Number(tournament.entryFee).toLocaleString("es-AR")} &middot; Premio: $
          {Number(tournament.prizePoolBase).toLocaleString("es-AR")}
        </p>
        <p className="mt-1 text-secondary">
          {tournament.visibility === "PRIVATE" ? "Privado — con código de acceso" : "Público"}
        </p>
        <p className="mt-1 text-secondary">
          Inicia: {new Date(tournament.startsAt).toLocaleString("es-AR")}
        </p>
      </div>

      <p className="mt-4 text-xs text-muted">
        Para cambiar estos datos por ahora hay que crear el torneo de nuevo — la edición de
        borradores es una mejora pendiente. Si está todo bien, publicalo.
      </p>

      <PublishButton tournamentId={tournament.id} />
    </main>
  );
}
