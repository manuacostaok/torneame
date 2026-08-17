"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createFriendDraw } from "@/lib/brackets/friendDraw";
import { isRateLimited } from "@/lib/security";

// Tope del plan gratuito — grupos más grandes quedan anotados como
// upsell futuro (Bloque de monetización), no se cobra nada todavía en
// este MVP, pero el límite ya está puesto para no tener que migrar datos
// después cuando se sume el plan pago.
// El tope gratuito subió de 8 a 22: con solo 1v1/2v2/3v3 alcanzaba, pero
// un picadito de 5v5 ya necesita 10 jugadores mínimo, y un 11v11 de
// fútbol posta necesita 22 — no tenía sentido dejar el modo abierto a
// cualquier NvN y mantener un tope que ni un partido de fútbol real
// entraba.
const FREE_MAX_PLAYERS = 22;

const createFriendTournamentSchema = z.object({
  gameId: z.string(),
  mode: z
    .string()
    .regex(/^\d{1,2}v\d{1,2}$/, "Formato inválido, usá algo como 5v5")
    .refine((m) => {
      const [a, b] = m.split("v").map(Number);
      return a === b && a >= 1 && a <= 11;
    }, "Los dos equipos tienen que tener el mismo tamaño (máximo 11v11)"),
  playerNames: z
    .array(z.string().trim().min(1).max(30))
    .min(2, "Cargá al menos 2 jugadores")
    .max(FREE_MAX_PLAYERS, `El plan gratuito soporta hasta ${FREE_MAX_PLAYERS} jugadores`),
});

export async function createFriendTournament(
  input: z.infer<typeof createFriendTournamentSchema>
) {
  // No requiere estar logueado a propósito — es la puerta de entrada sin
  // fricción que definimos como estrategia de adquisición, pedir login acá
  // reintroduciría exactamente la fricción que queremos evitar.
  const session = await auth();

  const identifierForRateLimit = session?.user?.id ?? "anon"; // ver nota abajo
  if (isRateLimited(`friend-tournament:${identifierForRateLimit}`, 10, 60_000)) {
    throw new Error("Demasiados torneos creados en poco tiempo. Esperá un minuto.");
  }

  const data = createFriendTournamentSchema.parse(input);
  const { teams, bracket } = createFriendDraw(data.playerNames, data.mode);

  const friendTournament = await prisma.friendTournament.create({
    data: {
      hostUserId: session?.user?.id ?? null,
      gameId: data.gameId,
      mode: data.mode,
      playerNames: data.playerNames,
      teams: teams as unknown as object,
      bracketJson: bracket as unknown as object,
    },
  });

  return friendTournament;
}

/*
 * Nota sobre el rate limit anónimo: usar la clave "anon" para todo
 * visitante sin sesión significa que el límite se comparte entre todos
 * los anónimos, no por persona — es una limitación conocida del MVP.
 * Antes de escalar esto en serio conviene limitar por IP (como ya
 * hacemos en el webhook de Mercado Pago) en vez de por usuario cuando no
 * hay sesión.
 */
