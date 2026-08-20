"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, isAdmin } from "@/auth";
import { isRateLimited, assertSameOrigin } from "@/lib/security";

const registerSchema = z.object({
  tournamentId: z.string(),
  // Solo hace falta si el torneo tiene costo — se valida a mano abajo,
  // no con zod, porque depende del entryFee del torneo que recién
  // conocemos después de buscarlo.
  receiptImageUrl: z.string().url().optional(),
});

/**
 * Inscribe al jugador. Si el torneo es pago, el comprobante de la
 * transferencia (que el jugador le manda directo al alias del
 * organizador — Torneame nunca toca esa plata) queda con el pago en
 * estado PENDING hasta que el organizador lo revise a mano y lo
 * apruebe o rechace desde confirmPayment().
 */
export async function registerForTournament(input: z.infer<typeof registerSchema>) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para inscribirte");

  // Evita que un script intente reservar cupos en loop (ej. para acaparar
  // lugares de un torneo popular y revenderlos, o simplemente trolear)
  if (isRateLimited(`register:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto e intentá de nuevo.");
  }

  const { tournamentId, receiptImageUrl } = registerSchema.parse(input);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new Error("Las inscripciones para este torneo no están abiertas");
  }
  if (tournament._count.registrations >= tournament.maxPlayers) {
    throw new Error("Ya no quedan cupos para este torneo");
  }
  if (Number(tournament.entryFee) > 0 && !receiptImageUrl) {
    throw new Error("Subí el comprobante de la transferencia para inscribirte");
  }

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!playerProfile) throw new Error("Completá tu perfil de jugador primero");

  const existing = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: playerProfile.id } },
  });
  if (existing) throw new Error("Ya estás inscripto en este torneo");

  const registration = await prisma.registration.create({
    data: { tournamentId, playerId: playerProfile.id },
  });

  // Torneo gratuito: no hay nada que transferir ni revisar, queda
  // confirmado directo
  if (Number(tournament.entryFee) === 0) {
    return { registration, needsReview: false };
  }

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      amount: tournament.entryFee,
      receiptImageUrl,
      status: "PENDING",
    },
  });

  return { registration, needsReview: true };
}

/**
 * El organizador (o un admin) aprueba o rechaza a mano el pago después de
 * revisar el comprobante — reemplaza al webhook de Mercado Pago que
 * existía antes. Idempotente a propósito: si ya se procesó, no vuelve a
 * disparar la recompensa de referido ni cambia nada.
 */
export async function confirmPayment(registrationId: string, approved: boolean) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournament: { include: { organizer: true } } },
  });
  if (!registration) throw new Error("Inscripción no encontrada");

  const isOwner = registration.tournament.organizer.userId === session.user.id;
  if (!isOwner && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }

  const payment = await prisma.payment.findUnique({ where: { registrationId } });
  if (!payment) throw new Error("Pago no encontrado para esta inscripción");
  if (payment.status !== "PENDING") {
    return payment; // ya se procesó antes, no hacemos nada de nuevo
  }

  const updated = await prisma.payment.update({
    where: { registrationId },
    data: { status: approved ? "APPROVED" : "REJECTED" },
  });

  if (approved) {
    await rewardReferrerOnFirstPayment(registrationId);
  }

  return updated;
}

/**
 * El crédito de referido se paga acá, no al registrarse, a propósito:
 * pagar por una cuenta creada (que puede ser fake o nunca volver) es
 * gastar plata en aire. Pagar cuando esa persona efectivamente puso
 * dinero real en la plataforma es la única señal que nos importa.
 */
async function rewardReferrerOnFirstPayment(registrationId: string) {
  const REFERRAL_REWARD_ARS = 2000;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { player: { include: { user: true } } },
  });
  if (!registration?.player.user.referredById) return;

  // Solo la primera vez: si el referido ya tiene otro pago aprobado antes
  // de este, no volvemos a pagarle al referente
  const previousApprovedPayments = await prisma.payment.count({
    where: {
      status: "APPROVED",
      registration: { playerId: registration.playerId },
      registrationId: { not: registrationId },
    },
  });
  if (previousApprovedPayments > 0) return;

  await prisma.user.update({
    where: { id: registration.player.user.referredById },
    data: { referralCreditsArs: { increment: REFERRAL_REWARD_ARS } },
  });
}
