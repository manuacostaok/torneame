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
