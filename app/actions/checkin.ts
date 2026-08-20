"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * El check-in queda atado a la URL que el QR codifica (ver
 * app/organizador/checkin/[registrationId]/page.tsx), no a un scanner de
 * cámara propio — así el organizador usa la cámara nativa del celular
 * para leer el QR y listo, sin que tengamos que mantener una librería de
 * lectura de códigos en el cliente.
 */
export async function checkInRegistration(registrationId: string) {
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournament: { include: { organizer: true } }, player: { include: { user: true } } },
  });
  if (!registration) throw new Error("Inscripción no encontrada");
  if (
    registration.tournament.organizer.userId !== session.user.id &&
    !isAdmin(session.user.role)
  ) {
    throw new Error("Este torneo no te pertenece");
  }
  if (registration.checkedInAt) {
    return registration; // ya estaba, evitamos pisar la hora original
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: { checkedInAt: new Date() },
  });

  revalidatePath(`/torneos/${registration.tournamentId}`);
  return { ...updated, playerName: registration.player.user.name };
}
