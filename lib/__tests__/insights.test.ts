import { describe, it, expect } from "vitest";
import { suggestBestTiming, suggestBestFormat, PastTournament } from "../insights";

function tournament(
  dateStr: string,
  registrationCount: number,
  format = "SINGLE_ELIMINATION",
  maxPlayers = 32
): PastTournament {
  return { startsAt: new Date(dateStr), registrationCount, format, maxPlayers };
}

describe("suggestBestTiming", () => {
  it("no sugiere nada con menos de 3 torneos (evita ruido de muestra chica)", () => {
    const result = suggestBestTiming([
      tournament("2026-06-06T14:00:00", 20),
      tournament("2026-06-13T14:00:00", 22),
    ]);
    expect(result).toBeNull();
  });

  it("identifica el mejor día/horario cuando hay un patrón claro", () => {
    // Sábados a la tarde siempre llenan más que entre semana a la noche
    const past = [
      tournament("2026-06-06T14:00:00", 30), // sábado
      tournament("2026-06-13T14:00:00", 28), // sábado
      tournament("2026-06-10T20:00:00", 12), // miércoles
      tournament("2026-06-17T20:00:00", 10), // miércoles
    ];
    const result = suggestBestTiming(past);
    expect(result?.dayOfWeek).toBe("sábado");
    expect(result?.avgRegistrations).toBeGreaterThan(20);
  });
});

describe("suggestBestFormat", () => {
  it("sugiere el formato con mejor tasa de llenado promedio", () => {
    const past = [
      tournament("2026-06-06T14:00:00", 30, "SINGLE_ELIMINATION", 32), // 94%
      tournament("2026-06-13T14:00:00", 28, "SINGLE_ELIMINATION", 32), // 87%
      tournament("2026-06-10T20:00:00", 8, "DOUBLE_ELIMINATION", 32), // 25%
    ];
    expect(suggestBestFormat(past)).toBe("SINGLE_ELIMINATION");
  });
});
