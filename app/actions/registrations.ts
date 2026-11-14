"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, isAdmin } from "@/auth";
import { isRateLimited, assertSameOrigin } from "@/lib/security";
import { wrapAction } from "@/lib/actionResult";

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
async function registerForTournament(input: z.infer<typeof registerSchema>) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para inscribirte");

  // Evita que un script intente reservar cupos en loop (ej. para acaparar
  // lugares de un torneo popular y revenderlos, o simplemente trolear)
  if (isRateLimited(`register:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto e intentá de nuevo.");
  }

  const { tournamentId, receiptImageUrl } = registerSchema.parse(input);

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!playerProfile) throw new Error("Completá tu perfil de jugador primero");

  const existing = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: playerProfile.id } },
  });
  if (existing) throw new Error("Ya estás inscripto en este torneo");

  // El cupo se valida y reserva atómicamente con un advisory lock de
  // Postgres sobre el torneo: sin esto, dos inscripciones que llegan casi
  // al mismo tiempo con el último cupo libre pueden leer "hay lugar" antes
  // de que cualquiera de las dos confirme, y el torneo termina con más
  // inscriptos que maxPlayers (rompe el generador de brackets, que asume
  // exactamente maxPlayers cupos). El lock serializa los intentos de
  // inscripción de ESTE torneo entre sí — no afecta inscripciones a otros
  // torneos — y funciona igual con varias instancias de Next.js corriendo,
  // porque vive en Postgres, no en memoria del proceso.
  const { registration, tournament } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tournamentId})::bigint)`;

    const tournament = await tx.tournament.findUnique({
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

    const registration = await tx.registration.create({
      data: { tournamentId, playerId: playerProfile.id },
    });

    return { registration, tournament };
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
async function confirmPayment(registrationId: string, approved: boolean) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      tournament: { include: { organizer: true } },
      player: { include: { user: true } },
    },
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

  if (!approved) {
    return prisma.payment.update({ where: { registrationId }, data: { status: "REJECTED" } });
  }

  const REFERRAL_REWARD_ARS = 2000;
  const referredById = registration.player.user.referredById;

  // Aprobar el pago y pagar el crédito de referido van en UNA sola
  // transacción bajo el advisory lock del jugador referido. Si la
  // aprobación se confirmara fuera del lock, dos pagos del mismo jugador
  // aprobados a la vez se verían mutuamente como "ya hay otro aprobado" y
  // ninguno pagaría el crédito. El crédito se paga acá, no al registrarse,
  // a propósito: solo cuando la persona puso plata real en la plataforma.
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${registration.playerId})::bigint)`;

    // Releer bajo el lock: otra aprobación concurrente pudo haberlo procesado.
    const current = await tx.payment.findUnique({ where: { registrationId } });
    if (!current || current.status !== "PENDING") return current ?? payment;

    const previousApproved = await tx.payment.count({
      where: {
        status: "APPROVED",
        registration: { playerId: registration.playerId },
        registrationId: { not: registrationId },
      },
    });

    const updated = await tx.payment.update({
      where: { registrationId },
      data: { status: "APPROVED" },
    });

    if (referredById && previousApproved === 0) {
      await tx.user.update({
        where: { id: referredById },
        data: { referralCreditsArs: { increment: REFERRAL_REWARD_ARS } },
      });
    }

    return updated;
  });
}

// Ver lib/actionResult.ts — Next.js reemplaza en producción el mensaje de
// cualquier error tirado directo desde una Server Action por uno genérico.
const wrappedRegisterForTournament = wrapAction(registerForTournament);
const wrappedConfirmPayment = wrapAction(confirmPayment);
export {
  wrappedRegisterForTournament as registerForTournament,
  wrappedConfirmPayment as confirmPayment,
};
