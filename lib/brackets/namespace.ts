import { BracketStructure } from "./types";

/**
 * Los generadores (generateSingleElimination, generateRoundRobin, etc.)
 * arrancan sus contadores de id en 1 cada vez que se llaman ("m1", "rr1",
 * "l1"...) porque son funciones puras que no saben nada de la base de
 * datos. Eso es perfecto para los tests, pero un problema real en
 * producción: `Match.id` es la primary key GLOBAL de la tabla — sin este
 * paso, dos torneos distintos generando cada uno un bracket de eliminación
 * simple chocarían los dos intentando crear un Match con id "m1". Lo mismo
 * pasaría entre los grupos de un mismo torneo en formato GROUPS, donde
 * cada grupo arma su propio round robin reseteando el contador.
 *
 * Este paso le agrega un prefijo único (normalmente el id del Bracket, o
 * `${bracketId}-${groupId}` para cada grupo) a cada id de partido y
 * reescribe las referencias internas (nextMatchId) para que sigan
 * apuntando correctamente dentro del mismo namespace.
 */
export function namespaceMatchIds(structure: BracketStructure, prefix: string): BracketStructure {
  const idMap = new Map(structure.matches.map((m) => [m.id, `${prefix}-${m.id}`]));
  return {
    ...structure,
    matches: structure.matches.map((m) => ({
      ...m,
      id: idMap.get(m.id)!,
      nextMatchId: m.nextMatchId ? (idMap.get(m.nextMatchId) ?? null) : null,
    })),
  };
}
