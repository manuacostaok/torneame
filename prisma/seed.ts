import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Juegos — sin límite, como pediste, pero arrancamos con los que
  // vimos en el perfil de referencia + algunos esports online populares
  const games = await Promise.all(
    [
      { name: "Mortal Kombat 9", platform: "PS3" },
      { name: "Ultimate Mortal Kombat 3", platform: "Sega Genesis" },
      { name: "EA Sports FC", platform: "Multiplataforma" },
      { name: "Counter-Strike 2", platform: "PC" },
      { name: "Valorant", platform: "PC" },
      { name: "Fútbol", platform: "Presencial" },
    ].map((g) => prisma.game.create({ data: g }))
  );
  const [mk9, umk3, fc, , cs2, valorant] = games;

  // Organizador de referencia — el caso de uso que analizamos
  const organizerPasswordHash = await hash("demo1234", 10);
  const organizerUser = await prisma.user.create({
    data: {
      email: "coronel@torneame.demo",
      name: "Team Coronel",
      role: "ORGANIZER",
      passwordHash: organizerPasswordHash,
      organizerProfile: {
        create: {
          orgName: "Team Coronel",
          slug: "team-coronel",
          bio: "Torneos presenciales de fighting games retro en Buenos Aires.",
          paymentAlias: "team.coronel.mp",
          verified: true,
        },
      },
    },
    include: { organizerProfile: true },
  });

  // Jugadores de prueba, con rating variado para que el ranking tenga sentido
  const playerData = [
    { name: "Facundo Ríos", gamertag: "facu_gg", elo: 1420 },
    { name: "Gabriela Sosa", gamertag: "gabyplays", elo: 1380 },
    { name: "Nicolás Duarte", gamertag: "nico_dt", elo: 1310 },
    { name: "Malena Ortiz", gamertag: "male.o", elo: 1290 },
    { name: "Tomás Ledesma", gamertag: "toto_ledesma", elo: 1180 },
    { name: "Ulises Farías", gamertag: "uli_fga", elo: 1050 },
  ];

  const players = [];
  for (const p of playerData) {
    const passwordHash = await hash("demo1234", 10);
    const user = await prisma.user.create({
      data: {
        email: `${p.gamertag}@torneame.demo`,
        name: p.name,
        role: "PLAYER",
        passwordHash,
        playerProfile: { create: { gamertag: p.gamertag, eloRating: p.elo } },
      },
      include: { playerProfile: true },
    });
    players.push(user.playerProfile!);
  }

  // Torneo con premio dinámico — el caso real que analizamos, 28 de 32
  // cupos ocupados para que se vea el premio ya escalado
  const tournament = await prisma.tournament.create({
    data: {
      organizerId: organizerUser.organizerProfile!.id,
      gameId: mk9.id,
      name: "Torneo Nacional Argentino",
      description: "FT2 con looser bracket. Gran final FT3.",
      bannerImageUrl: "https://picsum.photos/seed/torneame-mk9/800/450",
      format: "SINGLE_ELIMINATION",
      mode: "1v1",
      entryFee: 15000,
      prizePoolBase: 50000,
      prizePoolDynamicRule: { threshold: 16, bonusPerExtraPlayer: 3000, maxBonus: 60000 },
      locationType: "PRESENCIAL",
      venueAddress: "Slug Fest, José María Moreno 875, CABA",
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxPlayers: 32,
      status: "REGISTRATION_OPEN",
    },
  });

  // Segundo torneo, distinto juego y sin premio dinámico, para que la
  // landing y el ranking tengan variedad real al mirarlos
  await prisma.tournament.create({
    data: {
      organizerId: organizerUser.organizerProfile!.id,
      gameId: fc.id,
      name: "Copa Verano Rosario",
      format: "DOUBLE_ELIMINATION",
      mode: "1v1",
      entryFee: 8000,
      prizePoolBase: 80000,
      locationType: "PRESENCIAL",
      venueAddress: "Rosario, Santa Fe",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      maxPlayers: 16,
      status: "REGISTRATION_OPEN",
    },
  });

  // Inscripciones + pagos aprobados para el torneo principal, así el
  // dashboard de organizador tiene recaudación real para mostrar
  for (const player of players) {
    const registration = await prisma.registration.create({
      data: { tournamentId: tournament.id, playerId: player.id },
    });
    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        amount: 15000,
        status: "APPROVED",
      },
    });
  }

  // Un comentario de ejemplo, para que la sección de feedback no se vea vacía
  await prisma.comment.create({
    data: {
      tournamentId: tournament.id,
      authorId: (await prisma.user.findFirst({ where: { email: "facu_gg@torneame.demo" } }))!
        .id,
      body: "¿A qué hora arrancan las inscripciones en el lugar?",
    },
  });

  // Usuario admin de prueba, para poder entrar al panel de /admin apenas
  // se levanta el proyecto — sin esto no había con qué probarlo.
  const adminPasswordHash = await hash("demo1234", 10);
  await prisma.user.create({
    data: {
      email: "admin@torneame.demo",
      name: "Admin",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  console.log("Seed listo:", {
    organizador: organizerUser.organizerProfile!.slug,
    torneoPrincipal: tournament.id,
    jugadores: players.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
