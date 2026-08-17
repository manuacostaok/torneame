import { BracketPlayer, BracketMatch, BracketStructure, BracketError } from "./types";
import { generateSingleElimination } from "./singleElimination";

/**
 * Genera un bracket de eliminación doble: el "winners bracket" es un
 * single elimination normal; cada jugador que pierde ahí cae al "losers
 * bracket", donde una segunda derrota lo elimina del torneo. El campeón
 * del losers bracket enfrenta al campeón del winners bracket en la gran final.
 *
 * Esto es exactamente lo que vimos en el torneo real analizado
 * ("FT2 CON LOOSER BRACKET" — Team Coronel ya usa este formato a mano).
 */
export function generateDoubleElimination(players: BracketPlayer[]): BracketStructure {
  if (players.length < 2) {
    throw new BracketError("Se necesitan al menos 2 jugadores para generar un bracket");
  }

  // El winners bracket se genera igual que un single elimination
  const winnersBracket = generateSingleElimination(players);
  const winnersMatches: BracketMatch[] = winnersBracket.matches.map((m) => ({
    ...m,
    bracketSide: "winners" as const,
  }));

  const winnersRounds = winnersBracket.totalRounds;
  // El losers bracket tiene (2 * winnersRounds - 1) rondas en el caso general
  const losersRounds = winnersRounds * 2 - 1;

  let matchIdCounter = winnersMatches.length + 1;
  const losersMatches: BracketMatch[] = [];

  // Se arman las rondas del losers bracket vacías; el emparejamiento real
  // (qué perdedor de winners cae en qué partido de losers) se resuelve en
  // tiempo real a medida que se reportan resultados, vía dropToLosers().
  // Acá dejamos la estructura de rondas lista para recibir jugadores.
  let matchesInRound = Math.max(1, Math.floor(players.length / 4));
  for (let round = 1; round <= losersRounds && matchesInRound >= 1; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      losersMatches.push({
        id: `l${matchIdCounter++}`,
        round,
        matchNumber: i + 1,
        playerAId: null,
        playerBId: null,
        winnerId: null,
        nextMatchId: null,
        bracketSide: "losers",
      });
    }
    // las rondas de losers alternan entre "recibir caídos de winners" (se
    // mantiene la cantidad) y "cruzarse entre sí" (se reduce a la mitad)
    if (round % 2 === 0) matchesInRound = Math.ceil(matchesInRound / 2);
  }

  // Gran final: gana el campeón de winners, o gana el de losers (si el de
  // losers gana, en el formato clásico haría falta un "bracket reset" —
  // se modela como partido único acá y se resuelve en la capa de servicio)
  const grandFinal: BracketMatch = {
    id: `gf${matchIdCounter++}`,
    round: Math.max(winnersRounds, losersRounds) + 1,
    matchNumber: 1,
    playerAId: null,
    playerBId: null,
    winnerId: null,
    nextMatchId: null,
    bracketSide: "winners",
  };

  return {
    format: "double_elimination",
    totalRounds: grandFinal.round,
    matches: [...winnersMatches, ...losersMatches, grandFinal],
  };
}

/**
 * Mueve a un jugador que acaba de perder en el winners bracket hacia el
 * próximo partido disponible del losers bracket. Función pura: devuelve
 * una nueva estructura, no muta la original.
 */
export function dropToLosers(
  bracket: BracketStructure,
  loserPlayerId: string,
  fromRound: number
): BracketStructure {
  const matches = bracket.matches.map((m) => ({ ...m }));

  const targetRound = fromRound * 2 - 1; // mapeo estándar winners->losers
  const openSlot = matches.find(
    (m) =>
      m.bracketSide === "losers" &&
      m.round === targetRound &&
      (m.playerAId === null || m.playerBId === null)
  );

  if (!openSlot) {
    throw new BracketError(
      `No hay lugar disponible en el losers bracket para la ronda ${targetRound}`
    );
  }

  if (openSlot.playerAId === null) openSlot.playerAId = loserPlayerId;
  else openSlot.playerBId = loserPlayerId;

  return { ...bracket, matches };
}
