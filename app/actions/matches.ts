"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, requireRole, isAdmin } from "@/auth";
import { assertSameOrigin } from "@/lib/security";
import { reportMatchResult as reportMatchResultInEngine } from "@/lib/brackets/singleElimination";
import { dropToLosers } from "@/lib/brackets/doubleElimination";
import { revalidatePath } from "next/cache";
import { BracketStructure, StoredBracket } from "@/lib/brackets/types";
import { wrapAction } from "@/lib/actionResult";

/** Localiza un partido dentro de la estructura guardada (bracket suelto, o dentro de la fase de grupos/playoffs) y devuelve cómo reescribirlo sin tocar el resto. */
function locateMatch(
  stored: StoredBracket,
  matchId: string
): { structure: BracketStructure; replace: (updated: BracketStructure) => StoredBracket } | null {
  if (stored.kind === "bracket") {
    if (!stored.matches.some((m) => m.id === matchId)) return null;
    return { structure: stored, replace: (updated) => ({ ...updated, kind: "bracket" }) };
  }
  for (const group of stored.groups) {
    if (group.structure.matches.some((m) => m.id === matchId)) {
      return {
        structure: group.structure,
        replace: (updated) => ({
          ...stored,
          groups: stored.groups.map((g) => (g.id === group.id ? { ...g, structure: updated } : g)),
        }),
      };
    }
  }
  if (stored.playoffs?.matches.some((m) => m.id === matchId)) {
    const playoffs = stored.playoffs;
    return { structure: playoffs, replace: (updated) => ({ ...stored, playoffs: updated }) };
  }
  return null;
}

async function loadMatchWithTournament(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { bracket: { include: { tournament: { include: { organizer: true } } } } },
  });
  if (!match) throw new Error("Partido no encontrado");
  return match;
}

function assertIsOwnerOrAdmin(organizerUserId: string, sessionUserId: string, sessionRole: string) {
  if (organizerUserId !== sessionUserId && !isAdmin(sessionRole)) {
    throw new Error("Este torneo no te pertenece");
  }
}

/**
 * Carga el resultado de un partido y propaga el bracket: el ganador avanza
 * a la siguiente ronda y, en eliminación doble, el perdedor cae al losers
 * bracket (dropToLosers) — antes de este cambio esa parte nunca pasaba,
 * así que un torneo de eliminación doble quedaba con el losers bracket
 * vacío para siempre. Sincroniza también las filas de Match de CUALQUIER
 * otro partido que haya cambiado como efecto de esta propagación (el
 * partido siguiente, o el del losers bracket) — no solo el reportado.
 */
async function reportMatchResult(
  matchId: string,
  winnerId: string,
  scoreA: number,
  scoreB: number
) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const matchRow = await loadMatchWithTournament(matchId);
  assertIsOwnerOrAdmin(matchRow.bracket.tournament.organizer.userId, session.user.id, session.user.role);

  const stored = matchRow.bracket.structureJson as unknown as StoredBracket;
  const located = locateMatch(stored, matchId);
  if (!located) throw new Error("Partido no encontrado en la estructura del bracket");

  const match = located.structure.matches.find((m) => m.id === matchId)!;
  if (winnerId !== match.playerAId && winnerId !== match.playerBId) {
    throw new Error("El ganador debe ser uno de los dos jugadores del partido");
  }
  const loserId = winnerId === match.playerAId ? match.playerBId : match.playerAId;

  let updatedStructure = reportMatchResultInEngine(located.structure, matchId, winnerId);

  const isGrandFinal = matchId.includes("-gf");
  if (updatedStructure.format === "double_elimination" && match.bracketSide === "winners" && !isGrandFinal && loserId) {
    updatedStructure = dropToLosers(updatedStructure, loserId, match.round);
  }

  const newStored = located.replace(updatedStructure);

  const changed = updatedStructure.matches.filter((newM) => {
    const oldM = located.structure.matches.find((m) => m.id === newM.id);
    return (
      !oldM ||
      oldM.playerAId !== newM.playerAId ||
      oldM.playerBId !== newM.playerBId ||
      oldM.winnerId !== newM.winnerId
    );
  });
  // El propio partido reportado siempre cuenta como "cambiado" aunque el
  // motor no le haya tocado playerAId/playerBId (nunca los toca al
  // resolver, solo agrega winnerId) — sin esto se perdería el score y la
  // limpieza de pendingReports si por algún motivo no calificara arriba.
  if (!changed.some((m) => m.id === matchId)) {
    changed.push(updatedStructure.matches.find((m) => m.id === matchId)!);
  }

  await prisma.$transaction([
    prisma.bracket.update({
      where: { id: matchRow.bracketId },
      data: { structureJson: newStored as unknown as object },
    }),
    ...changed.map((m) =>
      prisma.match.update({
        where: { id: m.id },
        data: {
          playerAId: m.playerAId,
          playerBId: m.playerBId,
          winnerId: m.winnerId,
          status: m.winnerId ? "FINISHED" : "PENDING",
          ...(m.id === matchId
            ? { scoreA, scoreB, pendingReports: Prisma.DbNull }
            : {}),
        },
      })
    ),
  ]);

  const tournamentId = matchRow.bracket.tournamentId;
  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath(`/torneos/${tournamentId}/tv`);
  revalidatePath(`/torneos/${tournamentId}/gestionar`);
  return newStored;
}

/**
 * Descalifica a un jugador que no se presentó — el rival gana por default.
 * Reusa reportMatchResult entero (misma propagación, mismo drop a losers
 * en eliminación doble) en vez de duplicar la lógica.
 */
async function disqualifyPlayer(matchId: string, disqualifiedPlayerId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);
  const matchRow = await loadMatchWithTournament(matchId);
  assertIsOwnerOrAdmin(matchRow.bracket.tournament.organizer.userId, session.user.id, session.user.role);

  const stored = matchRow.bracket.structureJson as unknown as StoredBracket;
  const located = locateMatch(stored, matchId);
  if (!located) throw new Error("Partido no encontrado en la estructura del bracket");
  const match = located.structure.matches.find((m) => m.id === matchId)!;

  const opponentId =
    disqualifiedPlayerId === match.playerAId
      ? match.playerBId
      : disqualifiedPlayerId === match.playerBId
        ? match.playerAId
        : null;
  if (!opponentId) throw new Error("Ese jugador no está en este partido");

  const scoreA = match.playerAId === opponentId ? 1 : 0;
  const scoreB = match.playerBId === opponentId ? 1 : 0;
  return reportMatchResult(matchId, opponentId, scoreA, scoreB);
}

/**
 * El organizador convoca a los dos jugadores a jugar — dispara el timer de
 * DQ_TIMER_MINUTES minutos que ven ambos desde su celular (ver
 * app/torneos/[slug]/mi-entrada). No confirma resultado ni toca el
 * bracket, solo marca el partido como en curso.
 */
async function callMatch(matchId: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);
  const matchRow = await loadMatchWithTournament(matchId);
  assertIsOwnerOrAdmin(matchRow.bracket.tournament.organizer.userId, session.user.id, session.user.role);

  await prisma.match.update({
    where: { id: matchId },
    data: { calledAt: new Date(), status: "LIVE" },
  });
  revalidatePath(`/torneos/${matchRow.bracket.tournamentId}/gestionar`);
}

/** Le pone (o le cambia) el número de mesa/estación a un partido — texto libre. */
async function setMatchStation(matchId: string, station: string) {
  await assertSameOrigin();
  const session = await requireRole(["ORGANIZER", "ADMIN"]);
  const matchRow = await loadMatchWithTournament(matchId);
  assertIsOwnerOrAdmin(matchRow.bracket.tournament.organizer.userId, session.user.id, session.user.role);

  const trimmed = station.trim().slice(0, 40);
  await prisma.match.update({
    where: { id: matchId },
    data: { station: trimmed || null },
  });
  revalidatePath(`/torneos/${matchRow.bracket.tournamentId}/gestionar`);
  revalidatePath(`/torneos/${matchRow.bracket.tournamentId}/tv`);
}

/**
 * Auto-reporte de resultado por un jugador del propio partido — para no
 * depender de que el organizador esté mirando esa mesa en particular. Si
 * el rival ya había reportado y coincide, se confirma solo (misma
 * propagación que reportMatchResult); si no coincide, o todavía falta el
 * otro reporte, queda guardado en pendingReports para que el organizador
 * lo vea y destrabe a mano.
 */
async function submitPlayerReport(matchId: string, scoreA: number, scoreB: number) {
  await assertSameOrigin();
  const session = await auth();
  if (!session?.user) throw new Error("Necesitás iniciar sesión");

  const playerProfile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (!playerProfile) throw new Error("Necesitás un perfil de jugador");

  const matchRow = await loadMatchWithTournament(matchId);
  const isPlayerA = matchRow.playerAId === playerProfile.id;
  const isPlayerB = matchRow.playerBId === playerProfile.id;
  if (!isPlayerA && !isPlayerB) throw new Error("No sos parte de este partido");
  if (matchRow.status === "FINISHED") throw new Error("Este partido ya tiene resultado confirmado");

  const existing = (matchRow.pendingReports as { A?: unknown; B?: unknown } | null) ?? {};
  const myReport = { scoreA, scoreB, reportedAt: new Date().toISOString() };
  const updatedReports = isPlayerA ? { ...existing, A: myReport } : { ...existing, B: myReport };

  const otherReport = isPlayerA
    ? (updatedReports as { B?: { scoreA: number; scoreB: number } }).B
    : (updatedReports as { A?: { scoreA: number; scoreB: number } }).A;

  if (otherReport && otherReport.scoreA === scoreA && otherReport.scoreB === scoreB) {
    // Los dos reportes coinciden — se confirma solo, sin esperar al
    // organizador. reportMatchResult limpia pendingReports al confirmar.
    const winnerId = scoreA === scoreB
      ? null
      : scoreA > scoreB
        ? matchRow.playerAId
        : matchRow.playerBId;
    if (!winnerId) throw new Error("El resultado no puede ser empate — cargá quién ganó");
    return reportMatchResult(matchId, winnerId, scoreA, scoreB);
  }

  // Todavía no coinciden (falta el otro reporte, o los dos reportaron algo
  // distinto) — se guarda para que el organizador lo vea.
  await prisma.match.update({
    where: { id: matchId },
    data: { pendingReports: updatedReports as unknown as object },
  });
  revalidatePath(`/torneos/${matchRow.bracket.tournamentId}/mi-entrada`);
  revalidatePath(`/torneos/${matchRow.bracket.tournamentId}/gestionar`);

  return { disputed: Boolean(otherReport) };
}

// Ver lib/actionResult.ts — Next.js reemplaza en producción el mensaje de
// cualquier error tirado directo desde una Server Action por uno genérico.
// Se exportan solo las versiones envueltas, con el mismo nombre público de
// siempre (los call sites del cliente no cambian el import, solo envuelven
// el llamado con unwrapAction).
const wrappedReportMatchResult = wrapAction(reportMatchResult);
const wrappedDisqualifyPlayer = wrapAction(disqualifyPlayer);
const wrappedCallMatch = wrapAction(callMatch);
const wrappedSetMatchStation = wrapAction(setMatchStation);
const wrappedSubmitPlayerReport = wrapAction(submitPlayerReport);
export {
  wrappedReportMatchResult as reportMatchResult,
  wrappedDisqualifyPlayer as disqualifyPlayer,
  wrappedCallMatch as callMatch,
  wrappedSetMatchStation as setMatchStation,
  wrappedSubmitPlayerReport as submitPlayerReport,
};
