import { describe, it, expect } from "vitest";
import { wrapAction, unwrapAction } from "../actionResult";

describe("wrapAction", () => {
  it("devuelve { ok: true, data } cuando la función no tira error", async () => {
    const wrapped = wrapAction(async (x: number) => x * 2);
    expect(await wrapped(21)).toEqual({ ok: true, data: 42 });
  });

  it("devuelve { ok: false, error } con el mensaje real cuando tira un Error", async () => {
    const wrapped = wrapAction(async () => {
      throw new Error("Ya estás inscripto en este torneo");
    });
    expect(await wrapped()).toEqual({ ok: false, error: "Ya estás inscripto en este torneo" });
  });

  it("usa un mensaje genérico si se tira algo que no es un Error", async () => {
    const wrapped = wrapAction(async () => {
      throw "no soy un Error";
    });
    expect(await wrapped()).toEqual({ ok: false, error: "Algo salió mal" });
  });
});

describe("unwrapAction", () => {
  it("devuelve data directamente cuando el resultado es ok", async () => {
    expect(await unwrapAction(Promise.resolve({ ok: true, data: "listo" } as const))).toBe("listo");
  });

  it("tira un Error real (recuperable con try/catch) cuando el resultado no es ok", async () => {
    await expect(
      unwrapAction(Promise.resolve({ ok: false, error: "Cupo lleno" } as const))
    ).rejects.toThrow("Cupo lleno");
  });
});
