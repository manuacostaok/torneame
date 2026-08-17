import { z } from "zod";

// Forma de la regla que se guarda en Tournament.prizePoolDynamicRule (JSON).
// Se valida con zod al leerla, no se confía en que el JSON esté bien
// formado solo porque salió de nuestra propia base.
const dynamicRuleSchema = z.object({
  // A partir de este umbral de inscriptos empieza a sumar
  threshold: z.number().int().min(1),
  // Cuánto suma el premio por cada inscripto que supera el umbral
  bonusPerExtraPlayer: z.number().min(0),
  // Tope opcional para que el premio no crezca sin límite
  maxBonus: z.number().min(0).optional(),
});

export type DynamicPrizeRule = z.infer<typeof dynamicRuleSchema>;

/**
 * Calcula el premio final mostrado al jugador. Reproduce exactamente el
 * caso real que vimos en el torneo de referencia: "+16 players aumenta
 * los premios" — acá el organizador define el umbral y cuánto suma cada
 * inscripto extra, en vez de calcularlo a mano el día del evento.
 */
export function calculatePrizePool(
  basePrize: number,
  registrationCount: number,
  rule: unknown
): number {
  if (!rule) return basePrize;

  const parsed = dynamicRuleSchema.safeParse(rule);
  if (!parsed.success) return basePrize; // regla corrupta o vacía: no rompe la página, cae al premio base

  const { threshold, bonusPerExtraPlayer, maxBonus } = parsed.data;
  if (registrationCount <= threshold) return basePrize;

  const extraPlayers = registrationCount - threshold;
  let bonus = extraPlayers * bonusPerExtraPlayer;
  if (maxBonus !== undefined) bonus = Math.min(bonus, maxBonus);

  return basePrize + bonus;
}
