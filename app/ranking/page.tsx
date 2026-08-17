import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 120;

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ juego?: string }>;
}) {
  const { juego } = await searchParams;
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  // El ranking cross-organizador es la pieza diferencial que definimos en
  // el Bloque 1: el rating de un jugador no vive adentro de un solo
  // torneo, se acumula entre todos los organizadores de la plataforma.
  const players = await prisma.playerProfile.findMany({
    where: juego
      ? { registrations: { some: { tournament: { gameId: juego } } } }
      : undefined,
    orderBy: { eloRating: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-medium">Ranking global</h1>
      <p className="mt-1 text-sm text-secondary">
        Acumulado entre todos los organizadores de la plataforma, no solo un torneo.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/ranking"
          className={`rounded-full px-3 py-1 text-xs ${
            !juego ? "bg-primary text-white" : "bg-surface-1 text-secondary"
          }`}
        >
          Todos
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/ranking?juego=${g.id}`}
            className={`rounded-full px-3 py-1 text-xs ${
              juego === g.id ? "bg-primary text-white" : "bg-surface-1 text-secondary"
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {players.map((p, i) => (
          <Link
            href={`/jugadores/${p.id}`}
            key={p.id}
            className="flex items-center justify-between rounded-md bg-surface-1 p-3 transition hover:bg-surface-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm text-muted">{i + 1}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                {p.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{p.user.name}</p>
                <p className="text-xs text-muted">{p.gamertag}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-accent">{p.eloRating}</span>
          </Link>
        ))}
        {players.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay jugadores rankeados acá.</p>
        )}
      </div>
    </main>
  );
}
