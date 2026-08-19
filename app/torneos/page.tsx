import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 60;

export default async function TournamentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ juego?: string }>;
}) {
  const { juego } = await searchParams;
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS", "FINISHED"] },
      ...(juego ? { gameId: juego } : {}),
    },
    include: { game: true, organizer: true, _count: { select: { registrations: true } } },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-medium">Torneos</h1>
      <p className="mt-1 text-sm text-secondary">
        Todo lo que se está jugando en Torneame, sea o no tu cuenta.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/torneos"
          className={`rounded-full px-3 py-1 text-xs ${
            !juego ? "bg-primary text-white" : "bg-surface-1 text-secondary"
          }`}
        >
          Todos
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/torneos?juego=${g.id}`}
            className={`rounded-full px-3 py-1 text-xs ${
              juego === g.id ? "bg-primary text-white" : "bg-surface-1 text-secondary"
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/torneos/${t.id}`}
            className="overflow-hidden rounded-xl bg-surface-1 transition hover:bg-surface-2"
          >
            {t.bannerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.bannerImageUrl}
                alt={t.name}
                className="aspect-video w-full object-cover"
              />
            ) : (
              // Sin imagen cargada por el organizador: en vez de un hueco
              // vacío o un ícono roto, un bloque con el nombre del juego
              // — sigue transmitiendo de qué es el torneo
              <div className="flex aspect-video w-full items-center justify-center bg-surface-2 text-sm text-muted">
                {t.game.name}
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">{t.game.name}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    t.status === "IN_PROGRESS"
                      ? "bg-danger text-danger"
                      : t.status === "FINISHED"
                      ? "bg-surface-2 text-muted"
                      : "bg-success text-success"
                  }`}
                >
                  {t.status === "IN_PROGRESS"
                    ? "En vivo"
                    : t.status === "FINISHED"
                    ? "Finalizado"
                    : "Abierto"}
                </span>
              </div>
              <p className="mt-1 font-medium">{t.name}</p>
              <p className="mt-1 text-sm text-secondary">
                {t.organizer.orgName} · {t._count.registrations}/{t.maxPlayers} inscriptos
              </p>
            </div>
          </Link>
        ))}
        {tournaments.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted">
            No hay torneos {juego ? "de este juego" : ""} publicados todavía.
          </p>
        )}
      </div>
    </main>
  );
}
