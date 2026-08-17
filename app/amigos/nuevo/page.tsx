import { prisma } from "@/lib/prisma";
import { FriendTournamentForm } from "./FriendTournamentForm";

export default async function NewFriendTournamentPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-medium">Torneo entre amigos</h1>
      <p className="mt-1 text-sm text-secondary">
        Cargá los jugadores, elegí el modo y sorteamos los equipos y el
        cruce al toque. Sin cuentas, sin inscripción.
      </p>
      <FriendTournamentForm games={games} />
    </main>
  );
}
