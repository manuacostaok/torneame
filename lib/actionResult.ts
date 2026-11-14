// Next.js oculta en producción el mensaje de CUALQUIER error que una
// Server Action tire directo (lo reemplaza por un genérico en inglés,
// "An error occurred in the Server Components render...", para no
// filtrar detalles internos) — es un comportamiento documentado de
// Next.js, no algo específico de este proyecto, pero significa que TODOS
// los mensajes de validación en español que las actions tiran con `throw
// new Error("...")` nunca llegaban al usuario real en producción, en
// ninguna parte del sitio. Se descubrió probando el flujo de generar un
// bracket con esta cuenta de test, pero se reprodujo también en código
// viejo sin tocar (createOrganizerProfile) — es sistémico.
//
// La solución no es dejar de usar `throw` adentro de las actions (esa
// lógica ya es correcta y no se toca), sino no dejar que la excepción
// cruce el límite de la Server Action: wrapAction la atrapa ahí mismo y
// la devuelve como dato normal; unwrapAction, del lado del cliente, la
// vuelve a convertir en una excepción real — así el resto del código
// (los try/catch que ya existían en cada componente) sigue funcionando
// exactamente igual, mensaje real incluido.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function wrapAction<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args: Args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Algo salió mal" };
    }
  };
}

export async function unwrapAction<T>(promise: Promise<ActionResult<T>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
