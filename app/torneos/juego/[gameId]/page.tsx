import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { gameId: string };
}): Promise<Metadata> {
  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game) return {};

  const title = `Torneos de ${game.name} — Torneame`;
  const description = `Encontrá torneos de ${game.name} cerca tuyo, inscribite y competí por premios reales. Bracket en vivo, sin WhatsApp ni planillas.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

// Esta página es a propósito indexable y liviana en JS (sin fondo
// animado, sin nada interactivo pesado): el objetivo es rankear en
// Google para "torneos de [juego]", no impresionar con la demo.
export default async function GameLandingPage({ params }: { params: { gameId: string } }) {
  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game) notFound();

  const tournaments = await prisma.tournament.findMany({
    where: { gameId: game.id, status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS"] } },
    include: { organizer: true, _count: { select: { registrations: true } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-medium">Torneos de {game.name}</h1>
      <p className="mt-2 text-secondary">
        {tournaments.length > 0
          ? `${tournaments.length} torneo${tournaments.length === 1 ? "" : "s"} abierto${
              tournaments.length === 1 ? "" : "s"
            } ahora mismo.`
          : `Todavía no hay torneos de ${game.name} publicados — sé el primero en organizar uno.`}
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/torneos/${t.id}`}
            className="flex items-center justify-between rounded-md bg-surface-1 p-3 hover:bg-surface-2"
          >
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted">
                {t.organizer.orgName} · {t.locationType === "PRESENCIAL" ? "Presencial" : "Online"}
              </p>
            </div>
            <span className="text-xs text-secondary">
              {t._count.registrations}/{t.maxPlayers}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/organizador/torneos/nuevo"
        className="mt-8 inline-block rounded-md bg-primary px-4 py-2 text-sm text-white"
      >
        Organizar un torneo de {game.name}
      </Link>
    </main>
  );
}
