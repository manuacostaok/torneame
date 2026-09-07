"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { generateSingleElimination } from "@/lib/brackets/singleElimination";
import { generateDoubleElimination } from "@/lib/brackets/doubleElimination";
import { generateRoundRobin } from "@/lib/brackets/roundRobin";
import { createGroupsPhase, buildPlayoffsFromGroups } from "@/lib/brackets/groups";
import { namespaceMatchIds } from "@/lib/brackets/namespace";
import { orderPlayersForSeeding } from "@/lib/brackets/seed";
import { BracketMatch, BracketStructure, StoredBracket, StoredGroupsStructure } from "@/lib/brackets/types";

/** Junta todos los BracketMatch de una estructura persistible en una sola lista plana, para crear las filas de Match. */
function flattenMatches(stored: StoredBracket): BracketMatch[] {
  if (stored.kind === "bracket") return stored.matches;
  const groupMatches = stored.groups.flatMap((g) => g.structure.matches);
  const playoffMatches = stored.playoffs?.matches ?? [];
  return [...groupMatches, ...playoffMatches];
}

/**
 * Arranca el torneo: genera el bracket (o la fase de grupos) a partir de
 * los inscriptos y pasa el torneo a IN_PROGRESS. Es el paso que faltaba
 * en todo el codebase — hasta ahora no había ningún lugar que llamara a
 * los generadores de lib/brackets/* con los jugadores reales, así que
 * "el bracket se arma solo" (la promesa central del producto) no pasaba
 * de la letra del pitch.
 */
export async function startTournament(tournamentId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      organizer: true,
      bracket: true,
      registrations: { include: { player: { include: { user: true } } } },
    },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.organizer.userId !== session.user.id && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }
  if (tournament.bracket) throw new Error("Este torneo ya tiene un bracket generado");
  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new Error("El torneo tiene que estar con inscripción abierta para poder arrancarlo");
  }
  if (tournament.registrations.length < 2) {
    throw new Error("Necesitás al menos 2 inscriptos para generar el bracket");
  }

  const seeded = orderPlayersForSeeding(
    tournament.registrations.map((r) => ({
      id: r.playerId,
      name: r.player.user.name,
      eloRating: r.player.eloRating,
      checkedIn: Boolean(r.checkedInAt),
    }))
  );

  const bracketId = randomUUID();
  let stored: StoredBracket;

  switch (tournament.format) {
    case "SINGLE_ELIMINATION":
      stored = {
        kind: "bracket",
        ...namespaceMatchIds(generateSingleElimination(seeded), bracketId),
      };
      break;
    case "DOUBLE_ELIMINATION":
      stored = {
        kind: "bracket",
        ...namespaceMatchIds(generateDoubleElimination(seeded), bracketId),
      };
      break;
    case "ROUND_ROBIN":
      stored = {
        kind: "bracket",
        ...namespaceMatchIds(generateRoundRobin(seeded, false), bracketId),
      };
      break;
    case "LEAGUE":
      stored = {
        kind: "bracket",
        ...namespaceMatchIds(generateRoundRobin(seeded, true), bracketId),
      };
      break;
    case "GROUPS": {
      // No hay todavía forma de configurar la cantidad de grupos desde la
      // UI — se calcula un default razonable (grupos de ~4) en vez de
      // bloquear el arranque del torneo por eso.
      const groupCount = Math.max(2, Math.round(seeded.length / 4));
      const phase = createGroupsPhase(seeded, groupCount);
      const nameById = new Map(seeded.map((p) => [p.id, p.name]));
      stored = {
        kind: "groups",
        playersAdvancingPerGroup: phase.playersAdvancingPerGroup,
        playoffs: null,
        groups: phase.groups.map((g) => ({
          id: g.id,
          name: g.name,
          playerNames: Object.fromEntries(g.players.map((p) => [p.id, nameById.get(p.id) ?? p.name])),
          structure: namespaceMatchIds(g.roundRobin, `${bracketId}-${g.id}`),
        })),
      };
      break;
    }
    default:
      throw new Error(`Formato de torneo no soportado todavía: ${tournament.format}`);
  }

  const allMatches = flattenMatches(stored);

  await prisma.$transaction([
    prisma.bracket.create({
      data: {
        id: bracketId,
        tournamentId,
        structureJson: stored as unknown as object,
        currentRound: 1,
      },
    }),
    prisma.match.createMany({
      data: allMatches.map((m) => ({
        id: m.id,
        bracketId,
        round: m.round,
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        winnerId: m.winnerId,
        status: m.winnerId ? "FINISHED" : "PENDING",
      })),
    }),
    prisma.tournament.update({ where: { id: tournamentId }, data: { status: "IN_PROGRESS" } }),
  ]);

  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath(`/torneos/${tournamentId}/tv`);
  revalidatePath("/organizador/dashboard");

  return { bracketId };
}

/**
 * Una vez que todos los partidos de la fase de grupos tienen resultado
 * cargado, arma la eliminatoria con los mejores de cada grupo. Separado de
 * startTournament porque pasa en un momento distinto del torneo (cuando
 * termina la fase de grupos, no cuando arranca) — mismo criterio que ya
 * usa buildPlayoffsFromGroups en lib/brackets/groups.ts.
 */
export async function advanceGroupsToPlayoffs(tournamentId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: true, bracket: true },
  });
  if (!tournament?.bracket) throw new Error("Este torneo todavía no tiene un bracket generado");
  if (tournament.organizer.userId !== session.user.id && !isAdmin(session.user.role)) {
    throw new Error("Este torneo no te pertenece");
  }

  const stored = tournament.bracket.structureJson as unknown as StoredBracket;
  if (stored.kind !== "groups") throw new Error("Este torneo no está en formato de grupos");
  if (stored.playoffs) throw new Error("Los playoffs ya se armaron para este torneo");

  const allGroupMatches = stored.groups.flatMap((g) => g.structure.matches);
  const pending = allGroupMatches.filter((m) => !m.winnerId && m.playerAId && m.playerBId);
  if (pending.length > 0) {
    throw new Error(
      `Todavía faltan ${pending.length} partido(s) de la fase de grupos por cargar`
    );
  }

  const nameById = new Map(stored.groups.flatMap((g) => Object.entries(g.playerNames)));
  const playoffs = namespaceMatchIds(
    buildPlayoffsFromGroups({
      groups: stored.groups.map((g) => ({
        id: g.id,
        name: g.name,
        // buildPlayoffsFromGroups solo necesita id/seed/name para reconstruir
        // el sembrado de la eliminatoria — el seed real ya no importa acá,
        // el orden lo definen las posiciones de la tabla de cada grupo.
        players: Object.keys(g.playerNames).map((id, i) => ({
          id,
          seed: i + 1,
          name: nameById.get(id) ?? id,
        })),
        roundRobin: g.structure,
      })),
      playersAdvancingPerGroup: stored.playersAdvancingPerGroup,
    }),
    `${tournament.bracket.id}-playoffs`
  );

  const updatedStored: StoredGroupsStructure = { ...stored, playoffs };

  await prisma.$transaction([
    prisma.bracket.update({
      where: { tournamentId },
      data: { structureJson: updatedStored as unknown as object },
    }),
    prisma.match.createMany({
      data: playoffs.matches.map((m) => ({
        id: m.id,
        bracketId: tournament.bracket!.id,
        round: m.round,
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        winnerId: m.winnerId,
        status: m.winnerId ? "FINISHED" : "PENDING",
      })),
    }),
  ]);

  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath(`/torneos/${tournamentId}/tv`);
}
