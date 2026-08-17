import { describe, it, expect } from "vitest";
import { drawTeams, createFriendDraw } from "../friendDraw";

describe("drawTeams", () => {
  it("arma equipos de 2 sin repetir ni perder jugadores", () => {
    const players = ["Facu", "Gaby", "Nico", "Male", "Toto", "Uli"];
    const teams = drawTeams(players, 2);
    const allPlayers = teams.flatMap((t) => t.players);
    expect(allPlayers.sort()).toEqual([...players].sort());
    expect(teams).toHaveLength(3);
  });

  it("con cantidad impar, el equipo sobrante queda más chico en vez de fallar", () => {
    const players = ["Facu", "Gaby", "Nico", "Male", "Toto"];
    const teams = drawTeams(players, 2);
    expect(teams).toHaveLength(3); // 2, 2, 1
    expect(teams[2].players).toHaveLength(1);
  });

  it("rechaza si no alcanzan jugadores para ni un equipo", () => {
    expect(() => drawTeams(["Facu"], 2)).toThrow();
  });
});

describe("createFriendDraw", () => {
  it("genera equipos y un bracket coherente entre sí", () => {
    const { teams, bracket } = createFriendDraw(
      ["Facu", "Gaby", "Nico", "Male"],
      "2v2"
    );
    expect(teams).toHaveLength(2);
    const round1 = bracket.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(1);
    expect([round1[0].playerAId, round1[0].playerBId].sort()).toEqual(
      teams.map((t) => t.id).sort()
    );
  });
});
