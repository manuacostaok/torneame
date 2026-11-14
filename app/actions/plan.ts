"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { MercadoPagoConfig, PreApproval, Preference } from "mercadopago";
import { wrapAction } from "@/lib/actionResult";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

// Precios del plan PRO — viven acá como única fuente de verdad, no
// hardcodeados también en el checkout, para no desincronizar los dos.
// Dos formas de pagarlo: suscripción mensual (ilimitado) o por torneo
// suelto (para quien arma un evento puntual y no quiere atarse a un
// mensual que va a usar una sola vez).
const PRO_MONTHLY_PRICE_ARS = 25000;
const PRO_PER_TOURNAMENT_PRICE_ARS = 10000;

/**
 * Arranca la suscripción real vía Mercado Pago (preapproval = suscripción
 * recurrente, distinto de Preference que es un cobro único). El plan
 * recién pasa a PRO cuando el webhook confirma el primer pago — mismo
 * criterio de seguridad que usamos para las inscripciones: nunca
 * activamos algo pago por lo que dice el cliente, solo por lo que
 * confirma Mercado Pago del lado del servidor.
 */
async function startProSubscription() {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER"]);

  const organizer = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizer) throw new Error("Completá tu perfil de organizador primero");
  if (organizer.plan === "PRO") throw new Error("Ya tenés el plan PRO activo");

  const preapproval = new PreApproval(mpClient);
  const result = await preapproval.create({
    body: {
      reason: "Torneame PRO — plan mensual",
      external_reference: organizer.id,
      payer_email: session.user.email ?? undefined,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PRO_MONTHLY_PRICE_ARS,
        currency_id: "ARS",
      },
      back_url: `${process.env.APP_URL}/organizador/dashboard?pro=pendiente`,
    },
  });

  return { checkoutUrl: result.init_point };
}

/**
 * Llamada desde el webhook de Mercado Pago cuando confirma el pago de la
 * suscripción — igual que confirmPayment() para inscripciones.
 */
export async function activateProPlan(organizerId: string) {
  await prisma.organizerProfile.update({
    where: { id: organizerId },
    data: { plan: "PRO", planExpiresAt: addOneMonth(new Date()) },
  });
}

/**
 * Llamada desde el webhook cuando confirma (o rechaza) el pago de PRO por
 * torneo suelto — mismo criterio que activateProPlan: el estado lo decide
 * el webhook, nunca el cliente.
 */
export async function resolveTournamentProPurchase(purchaseId: string, approved: boolean) {
  await prisma.tournamentProPurchase.update({
    where: { id: purchaseId },
    data: { status: approved ? "APPROVED" : "REJECTED" },
  });
}

/**
 * PRO para un torneo puntual — mismo mecanismo de cobro único que
 * buyProduct() para la tienda (Preference de Mercado Pago, no
 * PreApproval), pero activa marca blanca + TV solo para ESE torneo, no
 * para el organizador entero. Pensado para quien arma un evento grande
 * una vez y no quiere pagar el mensual para usarlo una sola vez.
 */
async function buyTournamentPro(tournamentId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: true, proPurchase: true },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }
  if (tournament.organizer.plan === "PRO") {
    throw new Error("Ya tenés el plan PRO activo para todos tus torneos");
  }
  if (tournament.proPurchase?.status === "APPROVED") {
    throw new Error("Este torneo ya tiene PRO activado");
  }

  // Idempotente: si ya había un intento PENDING (por ejemplo, abrió el
  // checkout y no llegó a pagar), lo reusa en vez de crear uno nuevo.
  const purchase = await prisma.tournamentProPurchase.upsert({
    where: { tournamentId },
    create: { tournamentId, amount: PRO_PER_TOURNAMENT_PRICE_ARS, status: "PENDING" },
    update: {},
  });

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      items: [
        {
          id: purchase.id,
          title: `Torneame PRO para "${tournament.name}"`,
          quantity: 1,
          unit_price: PRO_PER_TOURNAMENT_PRICE_ARS,
        },
      ],
      external_reference: `tournament-pro:${purchase.id}`,
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.APP_URL}/torneos/${tournamentId}/gestionar?pro=pendiente`,
        failure: `${process.env.APP_URL}/torneos/${tournamentId}/gestionar`,
      },
    },
  });

  return { checkoutUrl: result.init_point };
}

async function setCustomDomain(customDomain: string) {
  const session = await requireRole(["ORGANIZER"]);
  const organizer = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!organizer) throw new Error("Perfil de organizador no encontrado");
  if (organizer.plan !== "PRO") {
    throw new Error("El dominio propio es una función del plan PRO");
  }

  return prisma.organizerProfile.update({
    where: { id: organizer.id },
    data: { customDomain },
  });
}

function addOneMonth(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

// Ver lib/actionResult.ts — Next.js reemplaza en producción el mensaje de
// cualquier error tirado directo desde una Server Action por uno genérico.
// activateProPlan y resolveTournamentProPurchase quedan afuera a
// propósito: las llama el webhook de Mercado Pago (una Route Handler, no
// un componente cliente), no hay límite de Server Action que cruzar ahí.
const wrappedStartProSubscription = wrapAction(startProSubscription);
const wrappedBuyTournamentPro = wrapAction(buyTournamentPro);
const wrappedSetCustomDomain = wrapAction(setCustomDomain);
export {
  wrappedStartProSubscription as startProSubscription,
  wrappedBuyTournamentPro as buyTournamentPro,
  wrappedSetCustomDomain as setCustomDomain,
};
