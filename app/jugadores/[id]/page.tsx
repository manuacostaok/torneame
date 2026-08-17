import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const player = await prisma.playerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      achievements: { orderBy: { earnedAt: "desc" }, take: 12 },
      registrations: {
        include: { tournament: { include: { game: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!player) notFound();

  const finishedTournaments = player.registrations.filter(
    (r) => r.tournament.status === "FINISHED"
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-1 text-lg font-medium">
          {player.user.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-medium">{player.user.name}</h1>
          <p className="text-sm text-secondary">@{player.gamertag}</p>
        </div>
      </div>

      {player.bio && <p className="mt-4 text-sm text-secondary">{player.bio}</p>}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-1 p-3 text-center">
          <p className="text-xs text-muted">Rating</p>
          <p className="mt-1 text-lg font-medium text-accent">{player.eloRating}</p>
        </div>
        <div className="rounded-xl bg-surface-1 p-3 text-center">
          <p className="text-xs text-muted">Jugados</p>
          <p className="mt-1 text-lg font-medium">{finishedTournaments.length}</p>
        </div>
        <div className="rounded-xl bg-surface-1 p-3 text-center">
          <p className="text-xs text-muted">Logros</p>
          <p className="mt-1 text-lg font-medium">{player.achievements.length}</p>
        </div>
      </div>

      {player.achievements.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm text-secondary">Logros</p>
          <div className="flex flex-wrap gap-2">
            {player.achievements.map((a) => (
              <span key={a.id} className="rounded-full bg-surface-1 px-3 py-1 text-xs">
                {a.type}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3 text-sm text-secondary">Historial de torneos</p>
        <div className="flex flex-col gap-2">
          {player.registrations.map((r) => (
            <Link
              key={r.id}
              href={`/torneos/${r.tournament.id}`}
              className="flex items-center justify-between rounded-md bg-surface-1 p-3 transition hover:bg-surface-2"
            >
              <div>
                <p className="text-sm font-medium">{r.tournament.name}</p>
                <p className="text-xs text-muted">{r.tournament.game.name}</p>
              </div>
              <span className="text-xs text-secondary">
                {r.tournament.status === "FINISHED" ? "Finalizado" : "En curso"}
              </span>
            </Link>
          ))}
          {player.registrations.length === 0 && (
            <p className="text-sm text-muted">Todavía no jugó ningún torneo.</p>
          )}
        </div>
      </div>
    </main>
  );
}
