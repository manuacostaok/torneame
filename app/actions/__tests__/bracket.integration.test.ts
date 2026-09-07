import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { startTournament } from "../bracket";
import { reportMatchResult, disqualifyPlayer } from "../matches";
import { StoredBracket } from "@/lib/brackets/types";
import { unwrapAction } from "@/lib/actionResult";

// Igual que registrations.race.integration.test.ts: esto ejercita Prisma
// de verdad (transacciones, createMany, JSON) contra una Postgres real —
// se salta entero sin DATABASE_URL.
const hasDb = Boolean(process.env.DATABASE_URL);

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  isAdmin: (role: string) => role === "ADMIN" || role === "SUPERADMIN",
}));

vi.mock("@/lib/security", () => ({
  assertSameOrigin: vi.fn().mockResolvedValue(undefined),
  isRateLimited: () => false,
}));

const mockedAuth = vi.mocked(auth) as unknown as {
  mockResolvedValue: (v: { user: { id: string; role: string } } | null) => void;
};

describe.skipIf(!hasDb)("startTournament + reportMatchResult (integración real)", () => {
  let gameId: string;
  let organizerUserId: string;
  let organizerId: string;
  let tournamentId: string;
  const playerUserIds: string[] = [];
  const playerProfileIds: string[] = [];

  beforeAll(async () => {
    const game = await prisma.game.create({ data: { name: `Bracket Test Game ${Date.now()}` } });
    gameId = game.id;

    const organizerUser = await prisma.user.create({
      data: { email: `bracket-organizer-${Date.now()}@test.local`, name: "Bracket Organizer", role: "ORGANIZER" },
    });
    organizerUserId = organizerUser.id;
    const organizer = await prisma.organizerProfile.create({
      data: { userId: organizerUserId, orgName: "Bracket Test Org", slug: `bracket-org-${Date.now()}` },
    });
    organizerId = organizer.id;

    const tournament = await prisma.tournament.create({
      data: {
        organizerId,
        gameId,
        name: "Bracket Test Tournament",
        format: "SINGLE_ELIMINATION",
        mode: "1v1",
        entryFee: 0,
        locationType: "ONLINE",
        startsAt: new Date(Date.now() + 86_400_000),
        registrationDeadline: new Date(Date.now() + 43_200_000),
        maxPlayers: 4,
        status: "REGISTRATION_OPEN",
      },
    });
    tournamentId = tournament.id;

    for (let i = 0; i < 4; i++) {
      const user = await prisma.user.create({
        data: { email: `bracket-player-${Date.now()}-${i}@test.local`, name: `Bracket Player ${i}` },
      });
      const profile = await prisma.playerProfile.create({
        data: { userId: user.id, gamertag: `bracketplayer${i}`, eloRating: 1000 + i * 100 },
      });
      playerUserIds.push(user.id);
      playerProfileIds.push(profile.id);
      await prisma.registration.create({
        data: { tournamentId, playerId: profile.id, checkedInAt: new Date() },
      });
    }
  });

  afterAll(async () => {
    const bracket = await prisma.bracket.findUnique({ where: { tournamentId } });
    if (bracket) {
      await prisma.match.deleteMany({ where: { bracketId: bracket.id } });
      await prisma.bracket.delete({ where: { id: bracket.id } });
    }
    await prisma.registration.deleteMany({ where: { tournamentId } });
    await prisma.tournament.delete({ where: { id: tournamentId } });
    await prisma.organizerProfile.delete({ where: { id: organizerId } });
    await prisma.user.delete({ where: { id: organizerUserId } });
    await prisma.playerProfile.deleteMany({ where: { id: { in: playerProfileIds } } });
    await prisma.user.deleteMany({ where: { id: { in: playerUserIds } } });
    await prisma.game.delete({ where: { id: gameId } });
  });

  it("genera el bracket con Match rows reales y el torneo pasa a IN_PROGRESS", async () => {
    mockedAuth.mockResolvedValue({ user: { id: organizerUserId, role: "ORGANIZER" } });

    const { bracketId } = await unwrapAction(startTournament(tournamentId));

    const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
    expect(tournament.status).toBe("IN_PROGRESS");

    const matches = await prisma.match.findMany({ where: { bracketId } });
    // 4 jugadores -> 2 partidos de ronda 1 + 1 final = 3 partidos
    expect(matches).toHaveLength(3);
    expect(matches.every((m) => m.id.startsWith(bracketId))).toBe(true);
  });

  it("reportMatchResult avanza al ganador a la siguiente ronda y lo refleja en la fila de Match", async () => {
    mockedAuth.mockResolvedValue({ user: { id: organizerUserId, role: "ORGANIZER" } });

    const bracket = await prisma.bracket.findUniqueOrThrow({ where: { tournamentId } });
    const stored = bracket.structureJson as unknown as StoredBracket;
    if (stored.kind !== "bracket") throw new Error("expected a plain bracket");
    const round1Match = stored.matches.find((m) => m.round === 1 && m.playerAId && m.playerBId)!;
    const winnerId = round1Match.playerAId!;

    await unwrapAction(reportMatchResult(round1Match.id, winnerId, 2, 0));

    const updatedBracket = await prisma.bracket.findUniqueOrThrow({ where: { tournamentId } });
    const updatedStored = updatedBracket.structureJson as unknown as StoredBracket;
    if (updatedStored.kind !== "bracket") throw new Error("expected a plain bracket");
    const finalMatch = updatedStored.matches.find((m) => m.round === 2)!;
    expect([finalMatch.playerAId, finalMatch.playerBId]).toContain(winnerId);

    const finalRow = await prisma.match.findUniqueOrThrow({ where: { id: finalMatch.id } });
    expect([finalRow.playerAId, finalRow.playerBId]).toContain(winnerId);

    const reportedRow = await prisma.match.findUniqueOrThrow({ where: { id: round1Match.id } });
    expect(reportedRow.status).toBe("FINISHED");
    expect(reportedRow.scoreA).toBe(2);
  });

  it("disqualifyPlayer hace ganar al rival por default", async () => {
    mockedAuth.mockResolvedValue({ user: { id: organizerUserId, role: "ORGANIZER" } });

    const bracket = await prisma.bracket.findUniqueOrThrow({ where: { tournamentId } });
    const stored = bracket.structureJson as unknown as StoredBracket;
    if (stored.kind !== "bracket") throw new Error("expected a plain bracket");
    const remainingRound1 = stored.matches.find(
      (m) => m.round === 1 && !m.winnerId && m.playerAId && m.playerBId
    )!;
    const dqPlayerId = remainingRound1.playerAId!;
    const expectedWinnerId = remainingRound1.playerBId!;

    await unwrapAction(disqualifyPlayer(remainingRound1.id, dqPlayerId));

    const row = await prisma.match.findUniqueOrThrow({ where: { id: remainingRound1.id } });
    expect(row.winnerId).toBe(expectedWinnerId);
    expect(row.status).toBe("FINISHED");
  });
});
