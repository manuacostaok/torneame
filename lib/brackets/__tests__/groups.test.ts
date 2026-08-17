import { describe, it, expect } from "vitest";
import { createGroupsPhase, buildPlayoffsFromGroups } from "../groups";
import { BracketPlayer } from "../types";

function makePlayers(count: number): BracketPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    name: `Jugador ${i + 1}`,
  }));
}

describe("createGroupsPhase", () => {
  it("reparte 8 jugadores en 2 grupos de 4 sin repetir ni perder a nadie", () => {
    const phase = createGroupsPhase(makePlayers(8), 2);
    const allPlayers = phase.groups.flatMap((g) => g.players.map((p) => p.id));
    expect(allPlayers.sort()).toEqual(makePlayers(8).map((p) => p.id).sort());
    expect(phase.groups[0].players).toHaveLength(4);
    expect(phase.groups[1].players).toHaveLength(4);
  });

  it("el seed 1 y el seed 2 quedan en grupos distintos (reparto serpiente)", () => {
    const phase = createGroupsPhase(makePlayers(8), 2);
    const groupOfSeed1 = phase.groups.find((g) => g.players.some((p) => p.id === "p1"));
    const groupOfSeed2 = phase.groups.find((g) => g.players.some((p) => p.id === "p2"));
    expect(groupOfSeed1!.id).not.toBe(groupOfSeed2!.id);
  });

  it("rechaza menos de 2 grupos", () => {
    expect(() => createGroupsPhase(makePlayers(8), 1)).toThrow();
  });
});

describe("buildPlayoffsFromGroups", () => {
  it("arma el cuadro eliminatorio con el top de cada grupo", () => {
    const phase = createGroupsPhase(makePlayers(8), 2, 2);

    // Simulamos que el primer jugador de cada grupo le gana a todos los demás
    for (const group of phase.groups) {
      const leader = group.players[0].id;
      group.roundRobin.matches = group.roundRobin.matches.map((m) => ({
        ...m,
        winnerId: m.playerAId === leader || m.playerBId === leader ? leader : m.playerAId,
      }));
    }

    const playoffs = buildPlayoffsFromGroups(phase);
    // 2 grupos x 2 que avanzan = 4 jugadores en playoffs
    const round1 = playoffs.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
  });
});
