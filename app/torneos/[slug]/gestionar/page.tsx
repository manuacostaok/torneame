import { auth, isAdmin } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StartTournamentButton } from "./StartTournamentButton";
import { MatchControls } from "./MatchControls";
import { AdvancePlayoffsButton } from "./AdvancePlayoffsButton";
import { BuyTournamentProButton } from "./BuyTournamentProButton";
import { BracketMatch, StoredBracket } from "@/lib/brackets/types";
import { calculateStandings } from "@/lib/brackets/roundRobin";
import { isTournamentPro } from "@/lib/tournamentConfig";

interface MatchRowData {
  scoreA: number | null;
  scoreB: number | null;
  calledAt: string | null;
  station: string | null;
  pendingReports: { A?: { scoreA: number; scoreB: number; reportedAt: string }; B?: { scoreA: number; scoreB: number; reportedAt: string } } | null;
}

export const revalidate = 0; // esta es la pantalla de "torneo en vivo" del organizador, siempre datos frescos

export default async function ManageTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/torneos/${slug}/gestionar`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: slug },
    include: {
      organizer: true,
      bracket: true,
      proPurchase: true,
      registrations: { include: { player: { include: { user: true } } } },
    },
  });
  if (!tournament) notFound();

  const isOwner = tournament.organizer.userId === session.user.id;
  if (!isOwner && !isAdmin(session.user.role)) redirect(`/torneos/${slug}`);

  const nameMap = Object.fromEntries(
    tournament.registrations.map((r) => [r.playerId, r.player.user.name])
  );
  const checkedInCount = tournament.registrations.filter((r) => r.checkedInAt).length;

  if (!tournament.bracket) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link href={`/torneos/${slug}`} className="text-sm text-secondary">
          ← Volver al torneo
        </Link>
        <h1 className="mt-3 text-xl font-medium">Gestionar {tournament.name}</h1>
        {!isTournamentPro(tournament) && <BuyTournamentProButton tournamentId={tournament.id} />}
        <div className="mt-6 rounded-xl bg-surface-1 p-4 text-sm">
          <p>{tournament.registrations.length} inscriptos — {checkedInCount} con check-in</p>
          <p className="mt-2 text-secondary">
            Todavía no generaste el bracket. Una vez que lo generes no se pueden agregar más
            inscriptos.
          </p>
        </div>
        {tournament.status === "REGISTRATION_OPEN" ? (
          <div className="mt-4">
            <StartTournamentButton tournamentId={tournament.id} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            El torneo tiene que estar publicado (inscripción abierta) para poder arrancarlo.
          </p>
        )}
      </main>
    );
  }

  const stored = tournament.bracket.structureJson as unknown as StoredBracket;

  const matchRows = await prisma.match.findMany({ where: { bracketId: tournament.bracket.id } });
  const matchRowById: Record<string, MatchRowData> = Object.fromEntries(
    matchRows.map((m) => [
      m.id,
      {
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        calledAt: m.calledAt ? m.calledAt.toISOString() : null,
        station: m.station,
        pendingReports: m.pendingReports as MatchRowData["pendingReports"],
      },
    ])
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/torneos/${slug}`} className="text-sm text-secondary">
        ← Volver al torneo
      </Link>
      <h1 className="mt-3 text-xl font-medium">Gestionar {tournament.name}</h1>
      {!isTournamentPro(tournament) && <BuyTournamentProButton tournamentId={tournament.id} />}

      {stored.kind === "bracket" && (
        <BracketMatches matches={stored.matches} nameMap={nameMap} matchRowById={matchRowById} />
      )}

      {stored.kind === "groups" && (
        <div className="mt-6 flex flex-col gap-8">
          {stored.groups.map((group) => {
            const players = Object.entries(group.playerNames).map(([id, name]) => ({
              id,
              name,
              seed: 0,
            }));
            const standings = calculateStandings(players, group.structure.matches);
            return (
              <div key={group.id}>
                <h2 className="text-base font-medium">{group.name}</h2>
                <table className="mt-2 w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th className="py-1">Jugador</th>
                      <th className="py-1">PJ</th>
                      <th className="py-1">G</th>
                      <th className="py-1">P</th>
                      <th className="py-1">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.playerId} className="border-t border-strong/30">
                        <td className="py-1">{group.playerNames[row.playerId] ?? row.playerId}</td>
                        <td className="py-1">{row.played}</td>
                        <td className="py-1">{row.wins}</td>
                        <td className="py-1">{row.losses}</td>
                        <td className="py-1 font-medium">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3">
                  <BracketMatches
                    matches={group.structure.matches}
                    nameMap={group.playerNames}
                    matchRowById={matchRowById}
                    compact
                  />
                </div>
              </div>
            );
          })}

          <div>
            <h2 className="text-base font-medium">Playoffs</h2>
            {stored.playoffs ? (
              <div className="mt-2">
                <BracketMatches
                  matches={stored.playoffs.matches}
                  nameMap={nameMap}
                  matchRowById={matchRowById}
                />
              </div>
            ) : (
              <div className="mt-2">
                <AdvancePlayoffsButton
                  tournamentId={tournament.id}
                  disabled={stored.groups
                    .flatMap((g) => g.structure.matches)
                    .some((m) => !m.winnerId && m.playerAId && m.playerBId)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function BracketMatches({
  matches,
  nameMap,
  matchRowById,
  compact,
}: {
  matches: BracketMatch[];
  nameMap: Record<string, string>;
  matchRowById: Record<string, MatchRowData>;
  compact?: boolean;
}) {
  const sides = Array.from(new Set(matches.map((m) => m.bracketSide ?? "single"))).sort();
  const showSideLabel = sides.length > 1;

  return (
    <div className={compact ? "flex flex-col gap-3" : "mt-6 flex flex-col gap-6"}>
      {sides.map((side) => {
        const sideMatches = matches.filter((m) => (m.bracketSide ?? "single") === side);
        const rounds = Array.from(new Set(sideMatches.map((m) => m.round))).sort((a, b) => a - b);
        return (
          <div key={side}>
            {showSideLabel && (
              <p className="mb-2 text-sm font-medium text-secondary">
                {side === "winners" ? "Winners bracket" : side === "losers" ? "Losers bracket" : "Gran final"}
              </p>
            )}
            <div className="flex flex-col gap-4">
              {rounds.map((round) => (
                <div key={round}>
                  <p className="text-xs text-muted">Ronda {round}</p>
                  <div className="mt-1 flex flex-col gap-3">
                    {sideMatches
                      .filter((m) => m.round === round)
                      .map((match) => {
                        const row = matchRowById[match.id];
                        return (
                          <div key={match.id} className="rounded-md bg-surface-1 p-3">
                            <MatchControls
                              matchId={match.id}
                              playerAId={match.playerAId}
                              playerBId={match.playerBId}
                              playerAName={match.playerAId ? nameMap[match.playerAId] ?? match.playerAId : "—"}
                              playerBName={match.playerBId ? nameMap[match.playerBId] ?? match.playerBId : "—"}
                              winnerId={match.winnerId}
                              scoreA={row?.scoreA ?? null}
                              scoreB={row?.scoreB ?? null}
                              calledAt={row?.calledAt ?? null}
                              station={row?.station ?? null}
                              pendingReports={row?.pendingReports ?? null}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
