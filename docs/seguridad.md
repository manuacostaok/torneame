# Capas de seguridad implementadas

No agregué esto como una sola cosa genérica — cada capa responde a un riesgo concreto de este producto específico (una plataforma que mueve dinero real de inscripciones):

## 1. Autenticación y autorización
- **Auth.js con JWT** — sesión con el rol (`PLAYER`/`ORGANIZER`/`ADMIN`) embebido en el token, para no pegarle a la base de datos en cada chequeo de permisos.
- **`requireRole()` en cada server action sensible** — crear torneo, publicar torneo, cargar resultado: todas verifican el rol en el servidor, nunca confían en que el botón "Crear torneo" simplemente no aparezca en la UI de un jugador. Ocultar un botón no es seguridad.
- **Guard duplicado en las páginas de organizador** — el wizard de creación (`app/organizador/torneos/nuevo/page.tsx`) redirige antes de renderizar si el usuario no tiene el rol correcto, además de que el server action lo vuelve a chequear. Es intencional tener el chequeo dos veces: si alguien accede directo a la URL, ni siquiera ve el formulario.

## 2. Pagos — la superficie más crítica
- **El webhook de Mercado Pago verifica la firma HMAC** (`lib/security.ts` → `verifyMercadoPagoSignature`) antes de tocar la base de datos. Sin esto, cualquiera podría mandarle un POST a `/api/webhooks/mercadopago` diciendo "este pago está aprobado" sin haber pagado un peso.
- **Nunca confiamos en el `status` que viene en el body del webhook** — el endpoint vuelve a consultarle a la API de Mercado Pago cuál es el estado real de ese pago específico, usando nuestro access token. El body del webhook solo se usa para saber *qué* pago consultar, no para decidir si está aprobado.
- **`confirmPayment` es idempotente** — si Mercado Pago reenvía la misma notificación (pasa seguido), no se procesa dos veces ni se duplica nada.
- **La inscripción se crea en estado `PENDING`** y solo pasa a confirmada cuando el webhook (verificado) lo dice — el cliente nunca puede marcar su propio pago como aprobado.

## 3. Validación de datos
- **Zod en cada server action que recibe input del usuario** (crear torneo, comentarios) — se valida tipo, longitud y rangos en el servidor, no solo en el formulario. La validación del wizard en el cliente es solo para dar feedback rápido, la que realmente importa es la del servidor.
- **XSS**: los comentarios se renderizan como texto plano de React (`{c.body}`), nunca con `dangerouslySetInnerHTML` — React escapa el contenido automáticamente, así que no hace falta (ni conviene) sanitizar HTML a mano.

## 4. Abuso y rate limiting
- Límites básicos por usuario/IP en: inscripción a torneos, comentarios, creación de torneos, y el webhook de pagos. Frena scripts que intenten acaparar cupos, floodear comentarios, o golpear el webhook con requests falsos.
- **Nota real**: el rate limiter actual es en memoria (`Map` en `lib/security.ts`), sirve para el MVP con una sola instancia corriendo. El día que escalemos a más de un servidor, esto se migra a Redis/Upstash — lo dejo anotado en el roadmap para no perderlo de vista.

## 5. Lo que falta (pendiente, no lo dejo pasar por alto)
- **CSRF**: las server actions de Next.js ya validan que el request venga del mismo origen por defecto, pero conviene revisarlo explícitamente antes de producción.
- **Sanitización de `venueAddress`/`description`** contra inyección si en algún momento se usan en emails HTML (Resend) — hoy no se usan así, pero hay que tenerlo en cuenta cuando se construya esa parte.
- **2FA para organizadores** — dado que manejan cobros, es un buen candidato para el roadmap V2 de seguridad, no solo de producto.
