import { describe, it, expect } from "vitest";
import { generateSingleElimination, reportMatchResult } from "../singleElimination";
import { BracketPlayer } from "../types";

function makePlayers(count: number): BracketPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    name: `Jugador ${i + 1}`,
  }));
}

describe("generateSingleElimination", () => {
  it("arma un bracket perfecto de 8 jugadores sin byes", () => {
    const bracket = generateSingleElimination(makePlayers(8));
    expect(bracket.totalRounds).toBe(3);
    const round1 = bracket.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);
    round1.forEach((m) => expect(m.winnerId).toBeNull()); // sin byes, nadie gana solo
  });

  it("completa con byes cuando la cantidad de jugadores no es potencia de 2 (caso real: 28 inscriptos)", () => {
    const bracket = generateSingleElimination(makePlayers(28));
    // el bracket se redondea a 32, así que hay 4 byes en primera ronda
    const round1 = bracket.matches.filter((m) => m.round === 1);
    const byes = round1.filter((m) => m.winnerId !== null);
    expect(byes).toHaveLength(4);
  });

  it("el seed 1 y el seed 2 solo pueden cruzarse en la final", () => {
    const bracket = generateSingleElimination(makePlayers(16));
    const round1 = bracket.matches.filter((m) => m.round === 1);
    const seed1Match = round1.find((m) => m.playerAId === "p1" || m.playerBId === "p1");
    const seed2Match = round1.find((m) => m.playerAId === "p2" || m.playerBId === "p2");
    expect(seed1Match?.id).not.toBe(seed2Match?.id);
  });

  it("rechaza torneos con menos de 2 jugadores", () => {
    expect(() => generateSingleElimination(makePlayers(1))).toThrow();
  });
});

describe("reportMatchResult", () => {
  it("propaga al ganador a la siguiente ronda", () => {
    let bracket = generateSingleElimination(makePlayers(4));
    const firstMatch = bracket.matches.find((m) => m.round === 1)!;
    bracket = reportMatchResult(bracket, firstMatch.id, firstMatch.playerAId!);

    const finalMatch = bracket.matches.find((m) => m.round === 2)!;
    expect([finalMatch.playerAId, finalMatch.playerBId]).toContain(firstMatch.playerAId);
  });

  it("rechaza un ganador que no jugó ese partido", () => {
    const bracket = generateSingleElimination(makePlayers(4));
    const match = bracket.matches[0];
    expect(() => reportMatchResult(bracket, match.id, "jugador-inexistente")).toThrow();
  });
});
