import { describe, it, expect } from "vitest";
import { orderPlayersForSeeding } from "../seed";

describe("orderPlayersForSeeding", () => {
  it("siembra por ELO descendente cuando nadie hizo check-in", () => {
    const result = orderPlayersForSeeding([
      { id: "a", name: "A", eloRating: 1000, checkedIn: false },
      { id: "b", name: "B", eloRating: 1400, checkedIn: false },
      { id: "c", name: "C", eloRating: 1200, checkedIn: false },
    ]);
    expect(result.map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(result.map((p) => p.seed)).toEqual([1, 2, 3]);
  });

  it("manda al fondo a quien no hizo check-in cuando al menos uno sí lo hizo", () => {
    const result = orderPlayersForSeeding([
      { id: "a", name: "A", eloRating: 1500, checkedIn: false }, // mejor ELO pero no llegó
      { id: "b", name: "B", eloRating: 1000, checkedIn: true },
      { id: "c", name: "C", eloRating: 1200, checkedIn: true },
    ]);
    expect(result.map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("no penaliza a nadie si ningún torneo online usó el check-in", () => {
    const result = orderPlayersForSeeding([
      { id: "a", name: "A", eloRating: 1000, checkedIn: false },
      { id: "b", name: "B", eloRating: 1400, checkedIn: false },
    ]);
    expect(result.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("asigna seeds consecutivos empezando en 1", () => {
    const result = orderPlayersForSeeding([
      { id: "a", name: "A", eloRating: 1000, checkedIn: true },
      { id: "b", name: "B", eloRating: 900, checkedIn: true },
    ]);
    expect(result.map((p) => p.seed)).toEqual([1, 2]);
  });
});
