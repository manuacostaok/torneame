"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRateLimited, assertSameOrigin } from "@/lib/security";
import { notifyFollowersOfNewTournament } from "./follows";

const createTournamentSchema = z.object({
  gameId: z.string(),
  name: z.string().min(3, "El nombre necesita al menos 3 caracteres"),
  description: z.string().optional(),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "LEAGUE", "GROUPS"]),
  mode: z.string().min(1),
  entryFee: z.number().min(0),
  prizePoolBase: z.number().min(0),
  locationType: z.enum(["ONLINE", "PRESENCIAL"]),
  venueAddress: z.string().optional(),
  startsAt: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  maxPlayers: z.number().int().min(2).max(512),
});

export async function createTournament(input: z.infer<typeof createTournamentSchema>) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  if (isRateLimited(`create-tournament:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados torneos creados en poco tiempo. Esperá un minuto.");
  }

  const data = createTournamentSchema.parse(input);

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizerProfile) throw new Error("Completá tu perfil de organizador primero");

  const tournament = await prisma.tournament.create({
    data: { ...data, organizerId: organizerProfile.id, status: "DRAFT" },
  });

  return tournament;
}

export async function publishTournament(tournamentId: string) {
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: true },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Este torneo no te pertenece");
  }

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "REGISTRATION_OPEN" },
  });

  await notifyFollowersOfNewTournament(tournamentId);

  revalidatePath(`/torneos/${tournamentId}`);
  return updated;
}
