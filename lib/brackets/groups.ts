import { BracketPlayer, BracketStructure, BracketError } from "./types";
import { generateRoundRobin, calculateStandings } from "./roundRobin";
import { generateSingleElimination } from "./singleElimination";

export interface Group {
  id: string;
  name: string; // "Grupo A", "Grupo B"...
  players: BracketPlayer[];
  roundRobin: BracketStructure;
}

export interface GroupsPhase {
  groups: Group[];
  playersAdvancingPerGroup: number;
}

/**
 * Reparte los jugadores en grupos parejos (round-robin de reparto, no en
 * bloques consecutivos, para que el sembrado no meta a los 4 mejores
 * rankeados en el mismo grupo si vienen ordenados por seed) y arma un
 * round robin dentro de cada uno.
 */
export function createGroupsPhase(
  players: BracketPlayer[],
  groupCount: number,
  playersAdvancingPerGroup: number = 2
): GroupsPhase {
  if (groupCount < 2) throw new BracketError("Necesitás al menos 2 grupos");
  if (players.length < groupCount * 2) {
    throw new BracketError("Necesitás al menos 2 jugadores por grupo");
  }

  const sorted = [...players].sort((a, b) => a.seed - b.seed);
  const groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `group${i + 1}`,
    name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C...
    players: [] as BracketPlayer[],
    roundRobin: { format: "single_elimination", totalRounds: 0, matches: [] },
  }));

  // Reparto tipo "serpiente" (1,2,3,4 / 4,3,2,1 / ...) para que el mejor
  // ranking de cada grupo quede parejo entre todos los grupos
  let direction = 1;
  let groupIndex = 0;
  for (const player of sorted) {
    groups[groupIndex].players.push(player);
    groupIndex += direction;
    if (groupIndex === groupCount) {
      groupIndex = groupCount - 1;
      direction = -1;
    } else if (groupIndex === -1) {
      groupIndex = 0;
      direction = 1;
    }
  }

  for (const group of groups) {
    group.roundRobin = generateRoundRobin(group.players);
  }

  return { groups, playersAdvancingPerGroup };
}

/**
 * Una vez que todos los partidos de grupos tienen resultado cargado, arma
 * la fase eliminatoria con los mejores de cada grupo. Función pura,
 * separada de createGroupsPhase, porque se llama en un momento distinto
 * del torneo (cuando terminó la fase de grupos, no cuando arrancó).
 */
export function buildPlayoffsFromGroups(phase: GroupsPhase): BracketStructure {
  const advancingPlayers: BracketPlayer[] = [];

  phase.groups.forEach((group, groupIdx) => {
    const standings = calculateStandings(group.players, group.roundRobin.matches);
    const top = standings.slice(0, phase.playersAdvancingPerGroup);

    top.forEach((row, position) => {
      const player = group.players.find((p) => p.id === row.playerId)!;
      // El seed del playoff cruza primeros de un grupo contra segundos de
      // otro grupo, no contra el mismo grupo del que salió — así el
      // motor de single elimination arma un cuadro parejo
      advancingPlayers.push({
        ...player,
        seed: position * phase.groups.length + groupIdx + 1,
      });
    });
  });

  return generateSingleElimination(advancingPlayers);
}
