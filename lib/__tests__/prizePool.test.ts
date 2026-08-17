import { describe, it, expect } from "vitest";
import { calculatePrizePool } from "../prizePool";

describe("calculatePrizePool", () => {
  it("devuelve el premio base sin regla configurada", () => {
    expect(calculatePrizePool(50000, 20, null)).toBe(50000);
  });

  it("no suma nada por debajo del umbral", () => {
    const rule = { threshold: 16, bonusPerExtraPlayer: 3000 };
    expect(calculatePrizePool(50000, 10, rule)).toBe(50000);
  });

  it("replica el caso real: +16 jugadores aumenta el premio", () => {
    const rule = { threshold: 16, bonusPerExtraPlayer: 3000 };
    // 28 inscriptos, como el torneo de referencia
    expect(calculatePrizePool(50000, 28, rule)).toBe(50000 + 12 * 3000);
  });

  it("respeta el tope máximo si está configurado", () => {
    const rule = { threshold: 16, bonusPerExtraPlayer: 3000, maxBonus: 20000 };
    expect(calculatePrizePool(50000, 40, rule)).toBe(70000); // 50000 + tope de 20000
  });

  it("no rompe si la regla guardada está corrupta", () => {
    expect(calculatePrizePool(50000, 20, { basura: true })).toBe(50000);
  });
});
