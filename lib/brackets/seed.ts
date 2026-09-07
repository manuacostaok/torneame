import { BracketPlayer } from "./types";

export interface RegisteredPlayer {
  id: string;
  name: string;
  eloRating: number;
  checkedIn: boolean;
}

/**
 * Ordena a los inscriptos para el sembrado del bracket: mejor ranking
 * (ELO) primero, pero solo entre quienes hicieron check-in — el que no
 * marcó check-in cae al fondo de la lista en vez de ocupar un lugar de
 * sembrado como si estuviera presente (mismo criterio que usa Challonge
 * para no desperdiciar un cruce temprano con alguien que no llegó).
 *
 * Si NADIE hizo check-in (torneo online que nunca usó esa función, o el
 * organizador arranca sin pedirlo), no penaliza a todo el mundo por
 * igual — trata el check-in como no usado y siembra por ELO nomás.
 */
export function orderPlayersForSeeding(players: RegisteredPlayer[]): BracketPlayer[] {
  const anyCheckedIn = players.some((p) => p.checkedIn);

  const ordered = anyCheckedIn
    ? [
        ...players.filter((p) => p.checkedIn).sort((a, b) => b.eloRating - a.eloRating),
        ...players.filter((p) => !p.checkedIn).sort((a, b) => b.eloRating - a.eloRating),
      ]
    : [...players].sort((a, b) => b.eloRating - a.eloRating);

  return ordered.map((p, i) => ({ id: p.id, seed: i + 1, name: p.name }));
}
