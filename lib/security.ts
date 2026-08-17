import { createHmac, timingSafeEqual } from "crypto";
import { headers } from "next/headers";

/**
 * Next.js ya protege las server actions verificando el header `Origin`
 * contra el host del deploy (desde la 13.4), pero para las acciones que
 * mueven dinero o cambian datos sensibles (inscripción, creación de
 * torneo) agregamos un segundo chequeo explícito. No es redundante por
 * las dudas: es defensa en profundidad — si en algún momento cambia la
 * config de Next o el deploy corre detrás de un proxy raro, esto no
 * depende de que el framework lo siga haciendo bien solo.
 */
export function assertSameOrigin() {
  const headerList = headers();
  const origin = headerList.get("origin");
  const allowedOrigin = process.env.APP_URL;

  if (!origin || !allowedOrigin || new URL(origin).host !== new URL(allowedOrigin).host) {
    throw new Error("Origen de la petición no permitido");
  }
}

/**
 * Verifica la firma que manda Mercado Pago en el header `x-signature`.
 * Sin esto, cualquiera podría pegarle a nuestro webhook y decir "este pago
 * se aprobó" sin haber pagado nada — es el punto más sensible de todo el
 * sistema de cobros, así que no es opcional.
 *
 * Formato del header: "ts=1704908010,v1=618c85345248dd820f209ff2c...".
 * Se recalcula el HMAC del manifest y se compara con timing-safe equal
 * para no filtrar información por diferencias de tiempo de respuesta.
 */
export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.trim().split("=") as [string, string])
  );
  const ts = parts["ts"];
  const receivedHash = parts["v1"];
  if (!ts || !receivedHash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expectedHash);
  const b = Buffer.from(receivedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Rate limiter simple en memoria para proteger endpoints sensibles
 * (login, webhooks, inscripción) contra abuso básico. Para producción con
 * más de una instancia corriendo, esto tiene que migrar a Redis/Upstash
 * — dejarlo anotado para no perderlo en el roadmap.
 */
/**
 * Rate limiter detrás de una interfaz chica a propósito: hoy la
 * implementación es en memoria (sirve para una sola instancia, que es
 * exactamente lo que tenemos en el MVP). El día que escalemos a más de
 * un servidor, se reemplaza `MemoryRateLimiter` por un
 * `UpstashRateLimiter` que hable con Redis — el resto del código
 * (`isRateLimited`) no cambia una línea porque solo conoce la interfaz.
 */
interface RateLimiter {
  check(key: string, limit: number, windowMs: number): boolean;
}

class MemoryRateLimiter implements RateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now > entry.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    entry.count++;
    return entry.count > limit;
  }
}

const rateLimiter: RateLimiter = new MemoryRateLimiter();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  return rateLimiter.check(key, limit, windowMs);
}
