import { prisma } from "@/lib/prisma";
import { auth, isAdmin } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { BracketMatch, StoredBracket } from "@/lib/brackets/types";
import Link from "next/link";

export const revalidate = 10; // el venue necesita que esto se sienta "en vivo"

export default async function TvBracketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Esta vista se abre en el dispositivo del organizador (para transmitirla
  // a una TV con el "Transmitir pestaña" nativo de Chrome — no hace falta
  // una app de Chromecast propia para eso), así que sí tiene sesión
  // disponible, a diferencia de una TV que abriera la URL directo.
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/torneos/${slug}/tv`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: slug },
    include: {
      bracket: true,
      game: true,
      organizer: true,
      registrations: { select: { playerId: true, player: { select: { user: { select: { name: true } } } } } },
    },
  });
  if (!tournament) notFound();

  const isOwner = tournament.organizer.userId === session.user.id;
  if (!isOwner && !isAdmin(session.user.role)) redirect(`/torneos/${slug}`);

  if (!tournament.bracket) notFound();

  // La vista TV es un beneficio del plan PRO: mostrar el bracket en una
  // pantalla grande en vivo es exactamente el tipo de pulido que separa un
  // torneo "de verdad" de uno amateur, y es donde el organizador FREE ve
  // el valor concreto de pasarse a PRO.
  if (tournament.organizer.plan !== "PRO" && !isAdmin(session.user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-sm text-[#8a93a6]">{tournament.name}</p>
        <h1 className="text-2xl font-medium sm:text-3xl">
          La vista para TV es una función del plan PRO
        </h1>
        <p className="max-w-sm text-sm text-[#8a93a6]">
          Mostrá el bracket en vivo en una pantalla grande del venue —
          transmitiéndolo desde tu celular o notebook a un Chromecast, sin
          instalar nada.
        </p>
        <Link
          href="/organizador/dashboard"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-white"
        >
          Volver a mi panel
        </Link>
      </div>
    );
  }

  const nameMap = Object.fromEntries(
    tournament.registrations.map((r) => [r.playerId, r.player.user.name])
  );
  const stored = tournament.bracket.structureJson as unknown as StoredBracket;
  const stations = Object.fromEntries(
    (await prisma.match.findMany({
      where: { bracketId: tournament.bracket.id, station: { not: null } },
      select: { id: true, station: true },
    })).map((m) => [m.id, m.station])
  );

  const sections: { title: string | null; matches: BracketMatch[]; nameMap: Record<string, string> }[] =
    stored.kind === "groups"
      ? [
          ...stored.groups.map((g) => ({ title: g.name, matches: g.structure.matches, nameMap: g.playerNames })),
          ...(stored.playoffs ? [{ title: "Playoffs", matches: stored.playoffs.matches, nameMap }] : []),
        ]
      : [{ title: null, matches: stored.matches, nameMap }];

  return (
    // Layout propio, sin nav ni footer del sitio — esto se transmite a la
    // TV del venue, no es una página que alguien navega desde el menú.
    // Los tamaños escalan con el viewport: chico y prolijo en el celular
    // del organizador antes de transmitir, grande y legible ya en la TV.
    <div className="min-h-screen bg-black p-6 text-white sm:p-10 md:p-12">
      <div className="mb-6 text-center sm:mb-10">
        <p className="text-base text-[#8a93a6] sm:text-xl md:text-2xl">{tournament.game.name}</p>
        <h1 className="mt-1 text-2xl font-medium sm:text-4xl md:text-5xl">{tournament.name}</h1>
        <p className="mt-2 text-xs text-[#5f6673]">
          Para pasarlo a la TV: abrí el menú de Chrome (⋮) → Transmitir → elegí tu Chromecast.
        </p>
      </div>

      {sections.map((section, i) => {
        const display = (id: string | null) => (id ? (section.nameMap[id] ?? id) : "—");
        const sides = Array.from(new Set(section.matches.map((m) => m.bracketSide ?? "single")));
        return (
          <div key={i} className="mb-10">
            {section.title && (
              <p className="mb-3 text-center text-lg text-[#8a93a6] sm:text-xl">{section.title}</p>
            )}
            {sides.map((side) => {
              const sideMatches = section.matches.filter((m) => (m.bracketSide ?? "single") === side);
              const rounds = Array.from(new Set(sideMatches.map((m) => m.round))).sort((a, b) => a - b);
              return (
                <div key={side} className="flex gap-4 overflow-x-auto pb-4 sm:gap-8 md:gap-12">
                  {rounds.map((round) => (
                    <div
                      key={round}
                      className="flex min-w-[220px] flex-col justify-center gap-3 sm:min-w-[240px] sm:gap-4 md:min-w-[280px] md:gap-6"
                    >
                      <p className="text-center text-sm text-[#8a93a6] sm:text-base md:text-lg">
                        Ronda {round}
                      </p>
                      {sideMatches
                        .filter((m) => m.round === round)
                        .map((match) => (
                          <div
                            key={match.id}
                            className={`rounded-xl p-3 text-base sm:p-4 sm:text-lg md:text-xl ${
                              match.winnerId
                                ? "bg-[#0d3b2e]"
                                : match.playerAId && match.playerBId
                                  ? "border-2 border-[#7c5cfc] bg-[#151a23]"
                                  : "bg-[#151a23]"
                            }`}
                          >
                            {display(match.playerAId)} vs {display(match.playerBId)}
                            {stations[match.id] && (
                              <p className="mt-1 text-xs text-[#8a93a6] sm:text-sm">{stations[match.id]}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
