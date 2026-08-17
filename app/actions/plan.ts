"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

// Precio del plan PRO — vive acá como única fuente de verdad, no
// hardcodeado también en el checkout, para no desincronizar los dos
const PRO_MONTHLY_PRICE_ARS = 12000;

/**
 * Arranca la suscripción real vía Mercado Pago (preapproval = suscripción
 * recurrente, distinto de Preference que es un cobro único). El plan
 * recién pasa a PRO cuando el webhook confirma el primer pago — mismo
 * criterio de seguridad que usamos para las inscripciones: nunca
 * activamos algo pago por lo que dice el cliente, solo por lo que
 * confirma Mercado Pago del lado del servidor.
 */
export async function startProSubscription() {
  assertSameOrigin();
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
      payer_email: session.user.email,
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

export async function setCustomDomain(customDomain: string) {
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
