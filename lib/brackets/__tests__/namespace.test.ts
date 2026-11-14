import { describe, it, expect } from "vitest";
import { namespaceMatchIds } from "../namespace";
import { generateSingleElimination } from "../singleElimination";

describe("namespaceMatchIds", () => {
  it("le agrega el prefijo a cada id de partido", () => {
    const structure = generateSingleElimination([
      { id: "a", seed: 1, name: "A" },
      { id: "b", seed: 2, name: "B" },
    ]);
    const namespaced = namespaceMatchIds(structure, "bracket123");
    for (const m of namespaced.matches) {
      expect(m.id.startsWith("bracket123-")).toBe(true);
    }
  });

  it("reescribe nextMatchId para que siga apuntando dentro del mismo namespace", () => {
    const structure = generateSingleElimination([
      { id: "a", seed: 1, name: "A" },
      { id: "b", seed: 2, name: "B" },
      { id: "c", seed: 3, name: "C" },
      { id: "d", seed: 4, name: "D" },
    ]);
    const namespaced = namespaceMatchIds(structure, "bracket123");
    const round1 = namespaced.matches.filter((m) => m.round === 1);
    for (const m of round1) {
      expect(m.nextMatchId).not.toBeNull();
      // el partido que referencia tiene que existir de verdad en la lista
      expect(namespaced.matches.some((x) => x.id === m.nextMatchId)).toBe(true);
    }
  });

  it("dos brackets distintos namespaceados no chocan ids entre sí", () => {
    const players = [
      { id: "a", seed: 1, name: "A" },
      { id: "b", seed: 2, name: "B" },
    ];
    const bracketOne = namespaceMatchIds(generateSingleElimination(players), "bracket1");
    const bracketTwo = namespaceMatchIds(generateSingleElimination(players), "bracket2");
    const idsOne = new Set(bracketOne.matches.map((m) => m.id));
    const overlap = bracketTwo.matches.some((m) => idsOne.has(m.id));
    expect(overlap).toBe(false);
  });
});
