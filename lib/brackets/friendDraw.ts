import { generateSingleElimination } from "./singleElimination";
import { BracketPlayer, BracketStructure, BracketError } from "./types";

export interface FriendTeam {
  id: string;
  name: string; // ej. "Facu & Gaby"
  players: string[];
}

/**
 * Mezcla la lista de jugadores (Fisher-Yates, no un simple .sort(random))
 * y arma equipos del tamaño pedido. Si no cierra exacto (ej. 5 jugadores
 * para equipos de 2), el resto queda en un equipo más chico al final en
 * vez de rechazar el sorteo — en un asado nunca cierra perfecto y no
 * queremos que el host tenga que ir a buscar un jugador más para poder
 * usar la función.
 */
export function drawTeams(playerNames: string[], teamSize: number): FriendTeam[] {
  if (playerNames.length < teamSize) {
    throw new BracketError(`Necesitás al menos ${teamSize} jugadores para este modo`);
  }

  const shuffled = [...playerNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const teams: FriendTeam[] = [];
  for (let i = 0; i < shuffled.length; i += teamSize) {
    const players = shuffled.slice(i, i + teamSize);
    teams.push({
      id: `team${teams.length + 1}`,
      name: players.join(" & "),
      players,
    });
  }

  return teams;
}

/**
 * Arma el torneo completo: sortea equipos y genera el bracket de
 * eliminación simple sobre esos equipos (no hace falta doble eliminación
 * ni round robin acá — para un torneo entre amigos de una tarde, simple
 * y rápido es la opción correcta, no la más completa).
 */
export function createFriendDraw(
  playerNames: string[],
  mode: string
): { teams: FriendTeam[]; bracket: BracketStructure } {
  const teamSize = parseTeamSize(mode);
  const teams = drawTeams(playerNames, teamSize);

  const bracketPlayers: BracketPlayer[] = teams.map((t, i) => ({
    id: t.id,
    seed: i + 1,
    name: t.name,
  }));

  const bracket = generateSingleElimination(bracketPlayers);
  return { teams, bracket };
}

/**
 * Extrae el tamaño de equipo de un modo tipo "5v5", "2v2", "7v7" — así
 * un picadito de 5 contra 5 en la plaza funciona exactamente igual que
 * un 2v2 de FIFA, sin tener que hardcodear cada caso posible a mano.
 */
function parseTeamSize(mode: string): number {
  const match = mode.match(/^(\d+)v\1$/); // exige que los dos números sean iguales (NvN)
  if (!match) return 1; // "1v1" o cualquier formato no reconocido cae a 1v1
  return parseInt(match[1], 10);
}
