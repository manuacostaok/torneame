import { describe, it, expect } from "vitest";
import { generateDoubleElimination, dropToLosers } from "../doubleElimination";
import { BracketPlayer } from "../types";

function makePlayers(count: number): BracketPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    name: `Jugador ${i + 1}`,
  }));
}

describe("generateDoubleElimination", () => {
  it("genera winners bracket, losers bracket y gran final", () => {
    const bracket = generateDoubleElimination(makePlayers(8));
    const sides = new Set(bracket.matches.map((m) => m.bracketSide));
    expect(sides.has("winners")).toBe(true);
    expect(sides.has("losers")).toBe(true);
    const grandFinal = bracket.matches[bracket.matches.length - 1];
    expect(grandFinal.round).toBe(bracket.totalRounds);
  });

  it("un jugador necesita perder dos veces para quedar eliminado (hay lugar en losers)", () => {
    const bracket = generateDoubleElimination(makePlayers(8));
    const losersRound1 = bracket.matches.filter(
      (m) => m.bracketSide === "losers" && m.round === 1
    );
    expect(losersRound1.length).toBeGreaterThan(0);
  });
});

describe("dropToLosers", () => {
  it("ubica al perdedor en el próximo slot libre del losers bracket", () => {
    const bracket = generateDoubleElimination(makePlayers(8));
    const updated = dropToLosers(bracket, "p3", 1);
    const placed = updated.matches.find(
      (m) => m.playerAId === "p3" || m.playerBId === "p3"
    );
    expect(placed).toBeDefined();
    expect(placed?.bracketSide).toBe("losers");
  });

  it("tira error si no hay lugar disponible en la ronda", () => {
    const bracket = generateDoubleElimination(makePlayers(2));
    expect(() => dropToLosers(bracket, "p1", 99)).toThrow();
  });
});
