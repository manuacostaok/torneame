import { BracketPlayer, BracketMatch, BracketStructure, BracketError } from "./types";

/**
 * Genera un round robin: todos contra todos, una sola vuelta.
 * Usa el algoritmo "round-robin de círculo" (uno queda fijo, los demás rotan)
 * que garantiza que cada jugador juegue exactamente una vez por ronda y
 * se enfrente a todos los demás exactamente una vez en total.
 *
 * `doubleRound = true` genera formato liga (ida y vuelta).
 */
export function generateRoundRobin(
  players: BracketPlayer[],
  doubleRound: boolean = false
): BracketStructure {
  if (players.length < 2) {
    throw new BracketError("Se necesitan al menos 2 jugadores para generar un round robin");
  }

  const list = [...players];
  const hasOddPlayers = list.length % 2 !== 0;
  if (hasOddPlayers) list.push({ id: "__bye__", seed: 0, name: "Bye" }); // jugador fantasma

  const n = list.length;
  const roundsPerLeg = n - 1;
  const matches: BracketMatch[] = [];
  let matchIdCounter = 1;

  const rotating = list.slice(1); // el primero queda fijo, el resto rota

  for (let round = 1; round <= roundsPerLeg; round++) {
    const fixed = list[0];
    const rotatingIndexed = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const playerA = rotatingIndexed[i];
      const playerB = rotatingIndexed[n - 1 - i];
      if (playerA.id === "__bye__" || playerB.id === "__bye__") continue; // nadie juega contra el bye

      matches.push({
        id: `rr${matchIdCounter++}`,
        round,
        matchNumber: i + 1,
        playerAId: playerA.id,
        playerBId: playerB.id,
        winnerId: null,
        nextMatchId: null,
      });
    }
    // rota todos menos el fijo
    rotating.unshift(rotating.pop()!);
  }

  if (doubleRound) {
    const secondLeg = matches.map((m) => ({
      ...m,
      id: `rr${matchIdCounter++}`,
      round: m.round + roundsPerLeg,
      // en la vuelta se invierte local/visitante
      playerAId: m.playerBId,
      playerBId: m.playerAId,
    }));
    matches.push(...secondLeg);
  }

  return {
    format: "single_elimination", // reutilizamos el tipo de estructura; el formato real vive en Tournament.format
    totalRounds: doubleRound ? roundsPerLeg * 2 : roundsPerLeg,
    matches,
  };
}

/** Calcula la tabla de posiciones a partir de los resultados cargados. */
export interface StandingsRow {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  points: number; // 3 por victoria, 0 por derrota — configurable a futuro
}

export function calculateStandings(
  players: BracketPlayer[],
  matches: BracketMatch[]
): StandingsRow[] {
  const table = new Map<string, StandingsRow>();
  for (const p of players) {
    table.set(p.id, { playerId: p.id, played: 0, wins: 0, losses: 0, points: 0 });
  }

  for (const match of matches) {
    if (!match.winnerId || !match.playerAId || !match.playerBId) continue;
    const loserId = match.winnerId === match.playerAId ? match.playerBId : match.playerAId;

    const winnerRow = table.get(match.winnerId);
    const loserRow = table.get(loserId);
    if (winnerRow) {
      winnerRow.played++;
      winnerRow.wins++;
      winnerRow.points += 3;
    }
    if (loserRow) {
      loserRow.played++;
      loserRow.losses++;
    }
  }

  return Array.from(table.values()).sort((a, b) => b.points - a.points);
}
