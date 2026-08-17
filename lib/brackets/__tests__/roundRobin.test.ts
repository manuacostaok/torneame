import { describe, it, expect } from "vitest";
import { generateRoundRobin, calculateStandings } from "../roundRobin";
import { BracketPlayer } from "../types";

function makePlayers(count: number): BracketPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    name: `Jugador ${i + 1}`,
  }));
}

describe("generateRoundRobin", () => {
  it("con 4 jugadores, cada uno juega exactamente 3 partidos (todos contra todos)", () => {
    const bracket = generateRoundRobin(makePlayers(4));
    const gamesPerPlayer = new Map<string, number>();
    bracket.matches.forEach((m) => {
      gamesPerPlayer.set(m.playerAId!, (gamesPerPlayer.get(m.playerAId!) ?? 0) + 1);
      gamesPerPlayer.set(m.playerBId!, (gamesPerPlayer.get(m.playerBId!) ?? 0) + 1);
    });
    expect([...gamesPerPlayer.values()]).toEqual([3, 3, 3, 3]);
  });

  it("maneja cantidad impar de jugadores sin partidos contra el bye", () => {
    const bracket = generateRoundRobin(makePlayers(5));
    const hasByeMatch = bracket.matches.some(
      (m) => m.playerAId === "__bye__" || m.playerBId === "__bye__"
    );
    expect(hasByeMatch).toBe(false);
  });

  it("modo liga (doubleRound) duplica la cantidad de partidos", () => {
    const single = generateRoundRobin(makePlayers(4), false);
    const league = generateRoundRobin(makePlayers(4), true);
    expect(league.matches.length).toBe(single.matches.length * 2);
  });
});

describe("calculateStandings", () => {
  it("ordena por puntos, 3 puntos por victoria", () => {
    const players = makePlayers(3);
    const bracket = generateRoundRobin(players);
    // p1 le gana a todos
    const withResults = bracket.matches.map((m) => ({
      ...m,
      winnerId: m.playerAId === "p1" || m.playerBId === "p1" ? "p1" : m.playerAId,
    }));
    const standings = calculateStandings(players, withResults);
    expect(standings[0].playerId).toBe("p1");
    expect(standings[0].points).toBeGreaterThanOrEqual(3);
  });
});
