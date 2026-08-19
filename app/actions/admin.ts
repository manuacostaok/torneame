"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { revalidatePath } from "next/cache";

/**
 * Le da (o saca) el plan PRO a un organizador a mano, sin pasar por
 * Mercado Pago — para cortesías, para el piloto con Team Coronel, o para
 * corregir un caso donde el pago se hizo por afuera de la plataforma.
 * Separado a propósito de `startProSubscription` (el flujo pago real):
 * un admin no debería tener que simular una suscripción de Mercado Pago
 * solo para regalarle el plan a alguien.
 */
export async function adminSetOrganizerPlan(organizerId: string, plan: "FREE" | "PRO") {
  await assertSameOrigin();
  await requireRole(["ADMIN"]);

  await prisma.organizerProfile.update({
    where: { id: organizerId },
    data: {
      plan,
      planExpiresAt: plan === "PRO" ? addOneYear(new Date()) : null,
    },
  });

  revalidatePath("/admin");
}

export async function adminVerifyOrganizer(organizerId: string, verified: boolean) {
  await assertSameOrigin();
  await requireRole(["ADMIN"]);

  await prisma.organizerProfile.update({ where: { id: organizerId }, data: { verified } });
  revalidatePath("/admin");
}

export async function adminDeleteComment(commentId: string) {
  await assertSameOrigin();
  await requireRole(["ADMIN"]);

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath("/admin");
}

function addOneYear(date: Date) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + 1);
  return result;
}
