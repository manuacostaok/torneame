// Fuente única de "¿este organizador tiene PRO hoy?". Antes se comparaba
// organizer.plan === "PRO" en cada lado, y planExpiresAt se guardaba pero
// nunca se miraba: un PRO cuya suscripción dejó de cobrarse seguía siendo
// PRO para siempre.

/** Días de tolerancia tras el vencimiento: Mercado Pago puede tardar en acreditar el cobro mensual. */
export const PLAN_GRACE_DAYS = 3;

export function isProActive(
  organizer: { plan: string; planExpiresAt?: Date | null },
  now: Date = new Date()
): boolean {
  if (organizer.plan !== "PRO") return false;
  // PRO sin fecha de vencimiento = otorgado a mano sin límite.
  if (!organizer.planExpiresAt) return true;
  const limit = organizer.planExpiresAt.getTime() + PLAN_GRACE_DAYS * 86_400_000;
  return limit > now.getTime();
}
