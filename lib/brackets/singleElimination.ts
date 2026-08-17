import { BracketPlayer, BracketMatch, BracketStructure, BracketError } from "./types";

/**
 * Genera un bracket de eliminación simple a partir de una lista de jugadores.
 *
 * Reglas:
 * - Se completa hasta la potencia de 2 más cercana hacia arriba con "byes"
 *   (jugadores fantasma que pasan de ronda automáticamente), para que el
 *   torneo funcione con cualquier cantidad de inscriptos, no solo 8/16/32.
 * - El sembrado sigue el estándar de brackets deportivos (1 vs último,
 *   2 vs anteúltimo, etc.) para que los mejores rankeados no se crucen
 *   en las primeras rondas.
 */
export function generateSingleElimination(players: BracketPlayer[]): BracketStructure {
  if (players.length < 2) {
    throw new BracketError("Se necesitan al menos 2 jugadores para generar un bracket");
  }

  const sorted = [...players].sort((a, b) => a.seed - b.seed);
  const bracketSize = nextPowerOfTwo(sorted.length);
  const totalRounds = Math.log2(bracketSize);

  const seededSlots = buildSeededOrder(bracketSize);
  const slots: (BracketPlayer | null)[] = seededSlots.map((seedPos) =>
    seedPos <= sorted.length ? sorted[seedPos - 1] : null // null = bye
  );

  const matches: BracketMatch[] = [];
  let matchIdCounter = 1;

  // Ronda 1: se arma directo desde los slots sembrados
  const round1Matches: BracketMatch[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const playerA = slots[i];
    const playerB = slots[i + 1];
    round1Matches.push({
      id: `m${matchIdCounter++}`,
      round: 1,
      matchNumber: i / 2 + 1,
      playerAId: playerA?.id ?? null,
      playerBId: playerB?.id ?? null,
      // Si uno de los dos es bye, el otro gana automático
      winnerId: playerA && !playerB ? playerA.id : !playerA && playerB ? playerB.id : null,
      nextMatchId: null,
    });
  }
  matches.push(...round1Matches);

  // Rondas siguientes: se arman vacías, enlazadas a la ronda anterior
  let previousRoundMatches = round1Matches;
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches: BracketMatch[] = [];
    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      const match: BracketMatch = {
        id: `m${matchIdCounter++}`,
        round,
        matchNumber: i / 2 + 1,
        playerAId: null,
        playerBId: null,
        winnerId: null,
        nextMatchId: null,
      };
      previousRoundMatches[i].nextMatchId = match.id;
      if (previousRoundMatches[i + 1]) previousRoundMatches[i + 1].nextMatchId = match.id;
      roundMatches.push(match);
    }
    matches.push(...roundMatches);
    previousRoundMatches = roundMatches;
  }

  // Propaga los byes de ronda 1 automáticamente hacia la ronda 2
  propagateByeWinners(matches);

  return { format: "single_elimination", totalRounds, matches };
}

/** Redondea hacia arriba a la potencia de 2 más cercana (8, 16, 32...). */
function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Orden de sembrado estándar de bracket deportivo: para un bracket de N,
 * devuelve el orden de posiciones (1, N, N/2+1, ...) para que el seed 1
 * y el seed 2 solo puedan cruzarse en la final.
 */
function buildSeededOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const round: number[] = [];
    const total = order.length * 2 + 1;
    for (const pos of order) {
      round.push(pos, total - pos);
    }
    order = round;
  }
  return order;
}

/** Si un jugador gana por bye en ronda 1, lo carga automático en la ronda 2. */
function propagateByeWinners(matches: BracketMatch[]) {
  for (const match of matches) {
    if (match.winnerId && match.nextMatchId) {
      const next = matches.find((m) => m.id === match.nextMatchId);
      if (!next) continue;
      if (next.playerAId === null && next.matchNumber * 2 - 1 === match.matchNumber) {
        next.playerAId = match.winnerId;
      } else if (next.playerBId === null) {
        next.playerBId = match.winnerId;
      }
    }
  }
}

/**
 * Reporta el resultado de un partido y devuelve el bracket actualizado,
 * propagando al ganador a la siguiente ronda. Función pura: no persiste nada.
 */
export function reportMatchResult(
  bracket: BracketStructure,
  matchId: string,
  winnerId: string
): BracketStructure {
  const matches = bracket.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match) throw new BracketError(`Partido ${matchId} no encontrado`);
  if (winnerId !== match.playerAId && winnerId !== match.playerBId) {
    throw new BracketError("El ganador debe ser uno de los dos jugadores del partido");
  }

  match.winnerId = winnerId;

  if (match.nextMatchId) {
    const next = matches.find((m) => m.id === match.nextMatchId);
    if (next) {
      if (next.playerAId === null) next.playerAId = winnerId;
      else next.playerBId = winnerId;
    }
  }

  return { ...bracket, matches };
}
