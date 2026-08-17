"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { isRateLimited, assertSameOrigin } from "@/lib/security";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

// Porcentaje de comisión de la plataforma, definido en el Bloque 2 (5-8%)
const COMMISSION_RATE = 0.07;

/**
 * Inicia una inscripción: crea el registro en estado pendiente y devuelve
 * el link de pago de Mercado Pago. El pago se confirma después vía webhook
 * (confirmPayment), nunca se marca como pagado desde el cliente.
 */
export async function registerForTournament(tournamentId: string) {
  assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para inscribirte");

  // Evita que un script intente reservar cupos en loop (ej. para acaparar
  // lugares de un torneo popular y revenderlos, o simplemente trolear)
  if (isRateLimited(`register:${session.user.id}`, 10, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto e intentá de nuevo.");
  }

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

  // Si el torneo es gratuito, se confirma directo sin pasar por Mercado Pago
  if (Number(tournament.entryFee) === 0) {
    return { registration, paymentUrl: null };
  }

  const commission = Number(tournament.entryFee) * COMMISSION_RATE;
  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      amount: tournament.entryFee,
      commissionAmount: commission,
      status: "PENDING",
    },
  });

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      items: [
        {
          id: tournament.id,
          title: `Inscripción — ${tournament.name}`,
          quantity: 1,
          unit_price: Number(tournament.entryFee),
        },
      ],
      external_reference: registration.id,
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.APP_URL}/torneos/${tournamentId}?inscripcion=exitosa`,
        failure: `${process.env.APP_URL}/torneos/${tournamentId}?inscripcion=fallida`,
      },
    },
  });

  return { registration, paymentUrl: result.init_point };
}

/**
 * Llamado desde el webhook de Mercado Pago (app/api/webhooks/mercadopago),
 * nunca directo desde el cliente — así no se puede falsificar un pago.
 * Es idempotente a propósito: Mercado Pago puede reenviar la misma
 * notificación más de una vez, y no queremos duplicar inscripciones ni
 * mandar notificaciones de confirmación dos veces.
 */
export async function confirmPayment(registrationId: string, approved: boolean) {
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
