import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registerForTournament, confirmPayment } from "../registrations";

// Test de integración de verdad: pg_advisory_xact_lock es una función real
// de Postgres, no existe en SQLite y mockear Prisma acá volvería el test
// inútil (pasaría sin importar si el lock funciona). Requiere DATABASE_URL
// apuntando a una base Postgres real — se salta entero si no está seteada,
// para no romper `npm test` en una máquina sin DB conectada.
const hasDb = Boolean(process.env.DATABASE_URL);

// auth.ts importa next-auth, que a su vez importa "next/server" — un
// módulo que solo existe dentro del runtime de Next.js, no en un test
// corrido con vitest/Node directo. Por eso el mock reemplaza el módulo
// entero (nunca carga el real vía importOriginal) en vez de solo pisar
// auth().
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  isAdmin: (role: string) => role === "ADMIN" || role === "SUPERADMIN",
}));

// assertSameOrigin lee el header Origin de una request real (next/headers,
// mismo problema de runtime que next-auth) — no existe acá, así que
// reemplazamos el módulo entero. isRateLimited se reimplementa como no-op:
// no es lo que este test ejercita, y cada intento simulado usa un usuario
// distinto de todos modos.
vi.mock("@/lib/security", () => ({
  assertSameOrigin: vi.fn().mockResolvedValue(undefined),
  isRateLimited: () => false,
}));

const mockedAuth = vi.mocked(auth);

/** Hace que auth() devuelva un usuario distinto en cada llamada, en el orden en que se invoca (no en el que resuelve). */
function mockAuthSequence(userIds: string[]) {
  let i = 0;
  mockedAuth.mockImplementation(() => {
    const id = userIds[i++];
    return Promise.resolve({ user: { id } } as Awaited<ReturnType<typeof auth>>);
  });
}

describe.skipIf(!hasDb)("registerForTournament — race de cupos (integración real)", () => {
  let gameId: string;
  let organizerUserId: string;
  let organizerId: string;
  let tournamentId: string;
  const playerUserIds: string[] = [];
  const playerProfileIds: string[] = [];
  const CONCURRENT_PLAYERS = 5;
  const MAX_PLAYERS = 1;

  beforeAll(async () => {
    const game = await prisma.game.create({ data: { name: `Race Test Game ${Date.now()}` } });
    gameId = game.id;

    const organizerUser = await prisma.user.create({
      data: { email: `race-organizer-${Date.now()}@test.local`, name: "Race Organizer" },
    });
    organizerUserId = organizerUser.id;
    const organizer = await prisma.organizerProfile.create({
      data: { userId: organizerUserId, orgName: "Race Test Org", slug: `race-org-${Date.now()}` },
    });
    organizerId = organizer.id;

    const tournament = await prisma.tournament.create({
      data: {
        organizerId,
        gameId,
        name: "Race Test Tournament",
        format: "SINGLE_ELIMINATION",
        mode: "1v1",
        entryFee: 0,
        locationType: "ONLINE",
        startsAt: new Date(Date.now() + 86_400_000),
        registrationDeadline: new Date(Date.now() + 43_200_000),
        maxPlayers: MAX_PLAYERS,
        status: "REGISTRATION_OPEN",
      },
    });
    tournamentId = tournament.id;

    for (let i = 0; i < CONCURRENT_PLAYERS; i++) {
      const user = await prisma.user.create({
        data: { email: `race-player-${Date.now()}-${i}@test.local`, name: `Race Player ${i}` },
      });
      const profile = await prisma.playerProfile.create({
        data: { userId: user.id, gamertag: `raceplayer${i}` },
      });
      playerUserIds.push(user.id);
      playerProfileIds.push(profile.id);
    }
  });

  afterAll(async () => {
    await prisma.registration.deleteMany({ where: { tournamentId } });
    await prisma.tournament.delete({ where: { id: tournamentId } });
    await prisma.organizerProfile.delete({ where: { id: organizerId } });
    await prisma.user.delete({ where: { id: organizerUserId } });
    await prisma.playerProfile.deleteMany({ where: { id: { in: playerProfileIds } } });
    await prisma.user.deleteMany({ where: { id: { in: playerUserIds } } });
    await prisma.game.delete({ where: { id: gameId } });
  });

  it(`deja pasar exactamente maxPlayers (${MAX_PLAYERS}) de ${CONCURRENT_PLAYERS} inscripciones simultáneas`, async () => {
    mockAuthSequence(playerUserIds);

    const results = await Promise.allSettled(
      playerUserIds.map(() => registerForTournament({ tournamentId }))
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );

    expect(fulfilled).toHaveLength(MAX_PLAYERS);
    expect(rejected).toHaveLength(CONCURRENT_PLAYERS - MAX_PLAYERS);
    for (const r of rejected) {
      expect((r.reason as Error).message).toBe("Ya no quedan cupos para este torneo");
    }

    const finalCount = await prisma.registration.count({ where: { tournamentId } });
    expect(finalCount).toBe(MAX_PLAYERS);
  });
});

describe.skipIf(!hasDb)("confirmPayment — race del crédito de referido (integración real)", () => {
  let gameId: string;
  let referrerUserId: string;
  let referredUserId: string;
  let referredPlayerId: string;
  const organizerUserIds: string[] = [];
  const organizerIds: string[] = [];
  const tournamentIds: string[] = [];
  const registrationIds: string[] = [];
  const REFERRAL_REWARD_ARS = 2000;

  beforeAll(async () => {
    const game = await prisma.game.create({ data: { name: `Referral Race Game ${Date.now()}` } });
    gameId = game.id;

    const referrer = await prisma.user.create({
      data: { email: `race-referrer-${Date.now()}@test.local`, name: "Referrer" },
    });
    referrerUserId = referrer.id;

    const referred = await prisma.user.create({
      data: {
        email: `race-referred-${Date.now()}@test.local`,
        name: "Referred",
        referredById: referrerUserId,
      },
    });
    referredUserId = referred.id;
    const referredPlayer = await prisma.playerProfile.create({
      data: { userId: referredUserId, gamertag: "referredplayer" },
    });
    referredPlayerId = referredPlayer.id;

    // Dos torneos de dos organizadores distintos, el mismo jugador
    // referido inscripto (con pago pendiente) en ambos.
    for (let i = 0; i < 2; i++) {
      const orgUser = await prisma.user.create({
        data: { email: `race-org-${Date.now()}-${i}@test.local`, name: `Org ${i}` },
      });
      const organizer = await prisma.organizerProfile.create({
        data: { userId: orgUser.id, orgName: `Org ${i}`, slug: `race-referral-org-${Date.now()}-${i}` },
      });
      const tournament = await prisma.tournament.create({
        data: {
          organizerId: organizer.id,
          gameId,
          name: `Referral Race Tournament ${i}`,
          format: "SINGLE_ELIMINATION",
          mode: "1v1",
          entryFee: 5000,
          locationType: "ONLINE",
          startsAt: new Date(Date.now() + 86_400_000),
          registrationDeadline: new Date(Date.now() + 43_200_000),
          maxPlayers: 16,
          status: "REGISTRATION_OPEN",
        },
      });
      const registration = await prisma.registration.create({
        data: { tournamentId: tournament.id, playerId: referredPlayerId },
      });
      await prisma.payment.create({
        data: { registrationId: registration.id, amount: 5000, status: "PENDING" },
      });

      organizerUserIds.push(orgUser.id);
      organizerIds.push(organizer.id);
      tournamentIds.push(tournament.id);
      registrationIds.push(registration.id);
    }
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { registrationId: { in: registrationIds } } });
    await prisma.registration.deleteMany({ where: { id: { in: registrationIds } } });
    await prisma.tournament.deleteMany({ where: { id: { in: tournamentIds } } });
    await prisma.organizerProfile.deleteMany({ where: { id: { in: organizerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: organizerUserIds } } });
    await prisma.playerProfile.delete({ where: { id: referredPlayerId } });
    await prisma.user.delete({ where: { id: referredUserId } });
    await prisma.user.delete({ where: { id: referrerUserId } });
    await prisma.game.delete({ where: { id: gameId } });
  });

  it("paga el crédito de referido una sola vez aunque los dos pagos se aprueben en simultáneo", async () => {
    mockAuthSequence(organizerUserIds);

    await Promise.allSettled(
      registrationIds.map((registrationId) => confirmPayment(registrationId, true))
    );

    const referrer = await prisma.user.findUniqueOrThrow({ where: { id: referrerUserId } });
    expect(referrer.referralCreditsArs).toBe(REFERRAL_REWARD_ARS);
  });
});
