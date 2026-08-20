"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRateLimited, assertSameOrigin } from "@/lib/security";
import { notifyFollowersOfNewTournament } from "./follows";

const createTournamentSchema = z.object({
  gameId: z.string(),
  name: z.string().min(3, "El nombre necesita al menos 3 caracteres"),
  description: z.string().optional(),
  bannerImageUrl: z.string().url().optional(),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "LEAGUE", "GROUPS"]),
  mode: z.string().min(1),
  entryFee: z.number().min(0),
  prizePoolBase: z.number().min(0),
  locationType: z.enum(["ONLINE", "PRESENCIAL"]),
  venueAddress: z.string().optional(),
  startsAt: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  maxPlayers: z.number().int().min(2).max(512),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I, para no confundir al tipearlo a mano

function generateAccessCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createTournament(input: z.infer<typeof createTournamentSchema>) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  if (isRateLimited(`create-tournament:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados torneos creados en poco tiempo. Esperá un minuto.");
  }

  const { visibility, ...data } = createTournamentSchema.parse(input);

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizerProfile) throw new Error("Completá tu perfil de organizador primero");

  // Un torneo privado necesita un código único para poder encontrarlo —
  // reintenta unas pocas veces por si el random choca con uno existente
  // (con 6 caracteres de un alfabeto de 33 son ~1500 millones de
  // combinaciones, así que un choque es rarísimo, pero no imposible).
  let accessCode: string | null = null;
  if (visibility === "PRIVATE") {
    for (let attempt = 0; attempt < 5 && !accessCode; attempt++) {
      const candidate = generateAccessCode();
      const taken = await prisma.tournament.findUnique({ where: { accessCode: candidate } });
      if (!taken) accessCode = candidate;
    }
    if (!accessCode) throw new Error("No se pudo generar un código único, probá de nuevo");
  }

  const tournament = await prisma.tournament.create({
    data: { ...data, visibility, accessCode, organizerId: organizerProfile.id, status: "DRAFT" },
  });

  // Solo devolvemos lo que el cliente necesita — el objeto completo trae
  // campos Decimal, que Next.js no puede serializar de vuelta a un
  // Client Component
  return { id: tournament.id };
}

/** Busca un torneo privado por su código de acceso, para el flujo "tengo un código" del lobby. */
export async function findTournamentByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error("Ingresá un código");

  const tournament = await prisma.tournament.findUnique({
    where: { accessCode: normalized },
    select: { id: true },
  });
  if (!tournament) throw new Error("No encontramos ningún torneo con ese código");

  return tournament;
}

export async function publishTournament(tournamentId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: true },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "REGISTRATION_OPEN" },
  });

  // Un torneo privado no se anuncia a todos los seguidores del organizador
  // — rompería el propósito de que solo entre quien tiene el código
  if (tournament.visibility !== "PRIVATE") {
    await notifyFollowersOfNewTournament(tournamentId);
  }

  revalidatePath(`/torneos/${tournamentId}`);
  return { id: tournamentId };
}
