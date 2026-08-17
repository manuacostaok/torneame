import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BracketView } from "@/app/torneos/[slug]/BracketView";
import Link from "next/link";

export default async function FriendTournamentPage({ params }: { params: { id: string } }) {
  const friendTournament = await prisma.friendTournament.findUnique({
    where: { id: params.id },
    include: { game: true },
  });

  if (!friendTournament) notFound();

  const teams = friendTournament.teams as unknown as {
    id: string;
    name: string;
    players: string[];
  }[];
  const nameMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <p className="text-sm text-secondary">{friendTournament.game.name} · {friendTournament.mode}</p>
      <h1 className="mt-1 text-xl font-medium">Equipos sorteados</h1>

      <div className="mt-4 flex flex-col gap-2">
        {teams.map((t) => (
          <div key={t.id} className="rounded-md bg-surface-1 p-3">
            <p className="font-medium">{t.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm text-secondary">Cruce</p>
        <BracketView structureJson={friendTournament.bracketJson} nameMap={nameMap} />
      </div>

      <div className="mt-8 flex gap-2">
        <Link
          href="/amigos/nuevo"
          className="flex-1 rounded-md border border-strong px-4 py-2 text-center text-sm"
        >
          Sortear otro
        </Link>
        <Link
          href="/organizador/torneos/nuevo"
          className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm text-white"
        >
          Armar un torneo real
        </Link>
      </div>
    </main>
  );
}
