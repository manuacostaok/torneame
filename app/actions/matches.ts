"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/auth";
import { reportMatchResult as reportMatchResultInEngine } from "@/lib/brackets/singleElimination";
import { revalidatePath } from "next/cache";
import { BracketStructure } from "@/lib/brackets/types";

/**
 * El organizador carga el resultado de un partido desde el celular, en el
 * momento. Esto reemplaza directamente el proceso manual que vimos en las
 * capturas de referencia (anotar en papel y armar el próximo cruce a mano).
 */
export async function reportMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  scoreA: number,
  scoreB: number
) {
  const session = await requireRole(["ORGANIZER", "ADMIN"]);

  const bracket = await prisma.bracket.findUnique({ where: { tournamentId } });
  if (!bracket) throw new Error("Este torneo todavía no tiene un bracket generado");

  const structure = bracket.structureJson as unknown as BracketStructure;
  const updatedStructure = reportMatchResultInEngine(structure, matchId, winnerId);

  await prisma.$transaction([
    prisma.bracket.update({
      where: { tournamentId },
      data: { structureJson: updatedStructure as unknown as object },
    }),
    prisma.match.update({
      where: { id: matchId },
      data: { winnerId, scoreA, scoreB, status: "FINISHED" },
    }),
  ]);

  revalidatePath(`/torneos/${tournamentId}`);
  return updatedStructure;
}
