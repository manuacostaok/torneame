import { describe, it, expect } from "vitest";
import { isProActive, PLAN_GRACE_DAYS } from "../plan";

const now = new Date("2026-06-15T12:00:00Z");
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("isProActive", () => {
  it("FREE nunca es PRO, aunque tenga fecha futura", () => {
    expect(isProActive({ plan: "FREE", planExpiresAt: daysFromNow(10) }, now)).toBe(false);
  });
  it("PRO sin vencimiento (otorgado a mano) sigue activo", () => {
    expect(isProActive({ plan: "PRO", planExpiresAt: null }, now)).toBe(true);
  });
  it("PRO con vencimiento futuro está activo", () => {
    expect(isProActive({ plan: "PRO", planExpiresAt: daysFromNow(5) }, now)).toBe(true);
  });
  it("PRO vencido dentro del período de gracia sigue activo", () => {
    expect(isProActive({ plan: "PRO", planExpiresAt: daysFromNow(-(PLAN_GRACE_DAYS - 1)) }, now)).toBe(true);
  });
  it("PRO vencido más allá de la gracia deja de serlo", () => {
    expect(isProActive({ plan: "PRO", planExpiresAt: daysFromNow(-(PLAN_GRACE_DAYS + 1)) }, now)).toBe(false);
  });
});
