"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRateLimited } from "@/lib/security";
import { notifyUserByWhatsApp } from "@/lib/notifications/whatsapp";
import { sendPushToUser } from "@/lib/notifications/push";

export async function followOrganizer(organizerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para seguir a un organizador");

  if (isRateLimited(`follow:${session.user.id}`, 30, 60_000)) {
    throw new Error("Demasiados intentos. Esperá un minuto.");
  }

  await prisma.follow.upsert({
    where: { followerId_organizerId: { followerId: session.user.id, organizerId } },
    create: { followerId: session.user.id, organizerId },
    update: {}, // ya lo seguía, no hace falta hacer nada más
  });

  revalidatePath(`/organizadores/[slug]`, "page");
}

export async function unfollowOrganizer(organizerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, organizerId },
  });

  revalidatePath(`/organizadores/[slug]`, "page");
}

/**
 * Se llama desde publishTournament (app/actions/tournaments.ts) — separado
 * en su propio archivo porque "avisar a los seguidores" es una
 * responsabilidad de notificaciones, no de torneos, aunque el trigger
 * salga de ahí.
 */
export async function notifyFollowersOfNewTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      organizer: { include: { followers: { include: { follower: true } } } },
      game: true,
    },
  });
  if (!tournament) return;

  const followers = tournament.organizer.followers.map((f) => f.follower);
  if (followers.length === 0) return;

  const message = `${tournament.organizer.orgName} publicó un nuevo torneo de ${tournament.game.name}: ${tournament.name}`;

  await prisma.notification.createMany({
    data: followers.map((user) => ({
      userId: user.id,
      type: "NEW_TOURNAMENT",
      payload: { message, tournamentId: tournament.id },
    })),
  });

  // El WhatsApp es "mejor esfuerzo": se manda en paralelo y si alguno
  // falla no bloquea a los demás ni rompe la notificación in-app, que ya
  // se guardó arriba de forma confiable
  await Promise.allSettled([
    ...followers.map((user) => notifyUserByWhatsApp(user, `🏆 ${message}`)),
    ...followers.map((user) =>
      sendPushToUser(user.id, { title: "Nuevo torneo", body: message, url: `/torneos/${tournament.id}` })
    ),
  ]);
}
