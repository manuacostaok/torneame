// Tipos del motor de brackets. Son funciones puras: no tocan la base de datos
// ni el estado de la UI, así se pueden testear de forma aislada y reusar
// tanto en la generación automática como en la edición manual del organizador.

export interface BracketPlayer {
  id: string;
  seed: number; // orden de siembra (1 = mejor ranking / primer inscripto)
  name: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number; // posición dentro de la ronda, empieza en 1
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  // A qué partido de la ronda siguiente avanza el ganador (null = es la final)
  nextMatchId: string | null;
  // Solo se usa en eliminación doble: identifica si el partido pertenece
  // al bracket ganador ("winners") o al de perdedores ("losers")
  bracketSide?: "winners" | "losers";
}

export interface BracketStructure {
  format: "single_elimination" | "double_elimination";
  totalRounds: number;
  matches: BracketMatch[];
}

export class BracketError extends Error {}

// GROUPS es el único formato cuyo Bracket.structureJson no es un
// BracketStructure plano: primero hay una fase de grupos (cada uno con su
// propio round robin) y recién cuando esa fase termina se arma la
// eliminatoria. Se distingue por el campo `kind`, chequeado en tiempo de
// ejecución por quien lee structureJson (server actions, BracketView, la
// vista de TV) antes de asumir una forma u otra.
export interface StoredGroupsStructure {
  kind: "groups";
  groups: {
    id: string;
    name: string;
    playerNames: Record<string, string>;
    structure: BracketStructure;
  }[];
  playersAdvancingPerGroup: number;
  // Se completa recién cuando el organizador corre "Avanzar a playoffs"
  // (ver advanceGroupsToPlayoffs en app/actions/bracket.ts) — hasta
  // entonces el torneo se juega solo dentro de cada grupo.
  playoffs: BracketStructure | null;
}

export interface StoredBracketStructure extends BracketStructure {
  kind: "bracket";
}

export type StoredBracket = StoredBracketStructure | StoredGroupsStructure;
