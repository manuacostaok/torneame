# Torneame — MVP

Plataforma de torneos presenciales/online para organizadores independientes.
Ver los documentos de estrategia (Bloques 1-3) para el contexto completo de negocio.

## Estado actual

- `prisma/schema.prisma` — modelo de datos completo (usuarios, torneos, inscripciones, pagos, brackets, partidos, seguidores, notificaciones, logros, comentarios).
- `lib/brackets/` — motor de brackets con los tres formatos principales: **eliminación simple**, **eliminación doble** (winners + losers bracket + gran final, como el formato real "FT2 con looser bracket" del torneo de referencia) y **round robin/liga** con tabla de posiciones. Todo son funciones puras, testeadas en `lib/brackets/__tests__/`.
- `auth.ts` — Auth.js con roles (jugador/organizador/admin) y un helper `requireRole()` para proteger server actions.
- `app/actions/` — server actions: crear/publicar torneo, inscripción por transferencia directa al organizador (comprobante + aprobación manual, ver sección de pagos más abajo), cargar resultado de partido (conecta el motor de brackets con la base), comentarios/feedback.
- `app/page.tsx` — landing pública (mobile-first, fondo animado, ISR cada 60s).
- `app/torneos/[slug]/page.tsx` — página pública del torneo: detalle, bracket en vivo con scroll horizontal en mobile, botón de inscripción, y sección de comentarios/feedback.
- `app/components/AnimatedBackground.tsx` — fondo animado reutilizable, CSS puro, respeta `prefers-reduced-motion`.
- `docs/diseno-responsive-animaciones.md` — criterios de diseño mobile-first y de performance de las animaciones.
- `docs/seguridad.md` — resumen y justificación de cada capa de seguridad implementada.
- `app/components/JoystickLogo.tsx` — logo del joystick como un único trazo dibujable (base + palanca + cable), controlado por un prop de progreso.
- `app/components/ParticleNetwork.tsx` — fondo de red de partículas conectadas (canvas), reutilizado en login y dashboard.
- `app/components/LoginModal.tsx` + `app/login/page.tsx` — pantalla de login: el logo se dibuja solo en sincro con el nombre "Torneame" escribiéndose letra por letra, subrayado con forma de cable del joystick, fondo de partículas.
- `app/components/Toast.tsx` — sistema de notificaciones toast, conectado a inscripción, comentarios y creación de torneo.
- `app/components/BracketDemo.tsx` — demo animada en la landing (bracket armándose y actualizándose solo) para que se entienda el valor del producto sin crear cuenta.
- `app/organizador/dashboard/page.tsx` — dashboard con recaudación, torneos activos, pagos pendientes y borradores, mismo fondo de partículas pero más tenue.
- `lib/security.ts` — verificación de firma de Mercado Pago, verificación explícita de origen (capa extra de CSRF), y rate limiter detrás de una interfaz swappeable a Redis/Upstash.
- **Landing completa** (`app/page.tsx`): hero, demo animada, próximos torneos, cómo funciona, juegos disponibles, preview de ranking, testimonios (placeholder estructural — sin datos reales todavía, ver comentario en el archivo), FAQ y footer.
- **Perfil de jugador** (`app/jugadores/[id]/page.tsx`) y **ranking global** (`app/ranking/page.tsx`, con filtro por juego) — el rating es cross-organizador, no vive adentro de un solo torneo.
- Logo rediseñado como silueta genérica de control de dos grips (inspirado en el clásico de dos grips tipo PS2, sin copiar el diseño protegido de ningún fabricante), con cruceta/botones/joysticks que aparecen una vez que el contorno termina de dibujarse. El subrayado del login ahora es un cable que sale del logo y termina en un plug.
- `app/components/GalaxianBackground.tsx` — reemplazó la red de partículas. Naves pixeladas estilo arcade retro (silueta genérica del género, no un sprite protegido puntual) formadas en escuadrón, con swing lateral, aleteo de dos frames, disparos ocasionales y naves que "bajan" a atacar de tanto en tanto. Se usa en login y dashboard.
- Tipografía pixel de arcade (`Press Start 2P`, vía `--font-pixel` en `globals.css`) para el título del login — el resto de la UI se queda en Inter/Space Grotesk por legibilidad. Título en blanco, subtítulo en gris (`--text-secondary`).
- **Modo Amigos** (`lib/brackets/friendDraw.ts`, `app/actions/friendTournaments.ts`, `app/amigos/`): torneo instantáneo sin cuentas ni inscripción paga — se cargan nombres, se sortean equipos (Fisher-Yates) y se genera el bracket reusando el motor de eliminación simple. El modo soporta cualquier NvN (1v1 hasta 11v11, no solo esports) — así un picadito de fútbol 5v5 en la plaza funciona con la misma herramienta. Gratis hasta 22 jugadores (suficiente para un 11v11 completo).
- **Dashboard de jugador** (`app/jugador/dashboard/page.tsx`): torneos activos/próximos, notificaciones sin leer, logros, historial, y sus torneos entre amigos recientes con un empujón hacia armar un torneo real — el puente entre las dos features.

## V1 del roadmap — completado en esta vuelta

- `lib/brackets/groups.ts` — fase de grupos (repartija tipo serpiente para que el seed 1 y 2 no queden en el mismo grupo, round robin adentro de cada uno, y armado de playoffs con el top de cada grupo). Era el único formato del roadmap sin motor propio.
- `app/actions/follows.ts` + `app/organizadores/[slug]/` — sistema de seguidores, con notificación automática a todos los seguidores cuando el organizador publica un torneo nuevo (conectado desde `publishTournament`).
- `lib/prizePool.ts` — premio dinámico configurable, ya conectado en la página pública del torneo (`app/torneos/[slug]/page.tsx`) en vez de mostrar solo el premio base fijo. Reproduce el caso real "+16 jugadores aumenta el premio" del torneo de referencia.
- **Check-in con QR** (`app/torneos/[slug]/mi-entrada`, `app/organizador/checkin/[registrationId]`) — el jugador muestra un QR que codifica un link; el organizador lo escanea con la cámara del celular (sin librería de lectura propia) y confirma con un toque.
- **Landing SEO por juego** (`app/torneos/juego/[gameId]`) — página liviana e indexable pensada para rankear en Google por "torneos de [juego]", con metadata dinámica.

Con esto, el V1 completo del roadmap del Bloque 3 queda cerrado.

## V2 del roadmap — completado en esta vuelta

- `app/actions/auth.ts` — registro de usuario real (era un hueco: nunca habíamos armado el alta), con aplicación de código de referido.
- `app/actions/registrations.ts` — recompensa de referido ($2.000 ARS de crédito) pagada recién cuando el referido hace su **primer pago aprobado**, no al registrarse — pagar por una cuenta que puede no volver nunca es tirar la plata.
- `lib/notifications/whatsapp.ts` — wrapper de Twilio, con opt-in obligatorio (nunca se manda sin `whatsappOptIn: true`) y fallo silencioso si no está configurado o si Twilio falla, para que nunca tire abajo la acción que lo dispara.
- `app/actions/plan.ts` — plan PRO con suscripción real vía Mercado Pago (`PreApproval`, no `Preference` — es recurrente). El plan pasa a PRO solo cuando el webhook confirma el pago, mismo criterio de seguridad que las inscripciones.
- Marca blanca aplicada de verdad: la página pública del torneo esconde el "Organizado con Torneame" cuando `organizer.plan === "PRO"`.
- `app/torneos/[slug]/tv/page.tsx` — vista de bracket para pantalla/TV del venue: alto contraste, letras grandes, sin nav ni footer del sitio.

## PWA — "instalar como app" + notificaciones push

- `app/manifest.ts` + `public/icon-192.png` / `icon-512.png` / `apple-touch-icon.png` — íconos generados de verdad a partir del logo del control (no placeholders), en los tamaños que pide cada plataforma. Con esto más el service worker, Chrome/Android ofrecen instalar la app a la pantalla de inicio.
- `public/sw.js` + `app/components/ServiceWorkerRegister.tsx` — service worker mínimo: solo lo necesario para cumplir el criterio de instalabilidad y mostrar notificaciones push, sin cache offline todavía (es una feature aparte, no haría falta para el cartel de instalar).
- `app/components/InstallAppBanner.tsx` — banner propio en vez del mini-infobar genérico del navegador (que casi nadie nota). En Android/Chrome dispara el prompt nativo; en iPhone (que no soporta ese evento) muestra las instrucciones manuales de "Compartir → Agregar a pantalla de inicio".
- `lib/notifications/push.ts` + `app/actions/pushSubscriptions.ts` + `app/components/PushNotificationOptIn.tsx` — notificaciones push reales (no solo in-app), conectadas al mismo disparador que ya usa WhatsApp: cuando un organizador que seguís publica un torneo. Necesita generar las VAPID keys una vez (`npx web-push generate-vapid-keys`, ver `.env.example`).

## V3 del roadmap — completado en esta vuelta

- **Sponsors** (`app/actions/sponsors.ts`, `SponsorsSection.tsx`) — atados al torneo puntual, no al organizador en general (una marca puede querer auspiciar un torneo grande y no otro chico). Tier `FEATURED` se muestra más grande que `BASIC`, porque si se vieran todos igual no habría diferencia real entre pagar uno u otro.
- **Marketplace de merchandising** (`app/actions/products.ts`) — reusa la misma Preference de Mercado Pago que las inscripciones, no es una integración de pagos nueva. El webhook ahora ramifica por un prefijo en `external_reference` (`product-order:` vs el id de inscripción) para saber a cuál de los dos confirmarle el pago.
- **Redes/franquicia** (`app/redes/[slug]`) — agrupa organizadores de distintas ciudades bajo una marca en común sin fusionarlos: cada uno sigue siendo dueño de sus propios torneos, cobros y seguidores.
- **"IA" de sugerencias** (`lib/insights.ts`) — ojo con el nombre: es un análisis estadístico directo sobre el historial propio del organizador (mejor día/horario, mejor formato según tasa de llenado), no un modelo entrenado. Se lo llama "sugerencias" en la UI, no "IA", para no vender algo que no es. Necesita mínimo 3 torneos pasados para sugerir algo — con menos, no hay patrón, hay ruido.
- **App móvil nativa**: decisión consciente de NO construirla todavía — la PWA instalable que ya armamos cubre la mayoría del caso de uso a una fracción del costo de mantener un codebase de React Native aparte. Se reevalúa cuando haya tracción real que lo justifique.

Con esto el roadmap completo (V1, V2, V3) del Bloque 3 queda cerrado.

## Auditoría de mobile (sin poder correr un browser real)

Este sandbox no tiene los binarios de Playwright instalados y no hay red para bajarlos, así que no pude sacar capturas reales. Lo que sí hice fue un grep sistemático de todo el proyecto buscando los patrones que más comúnmente rompen el diseño en mobile — grillas sin variante `sm:`, texto que no puede hacer wrap, headers con nombre+botón sin que el bloque de texto pueda achicarse. Encontré y corregí 4 casos reales (headers de torneo, organizador y dashboard de jugador que un nombre largo podía romper) — anotado en el historial de cambios de cada archivo. **Esto no reemplaza probarlo en un celular real** una vez que lo tengas deployado.

## Setup local

```bash
npm install
cp .env.example .env       # completar DATABASE_URL con tu Postgres (ej. Neon o Supabase)
npm run db:push            # crea las tablas según el schema de Prisma
npm run db:seed            # carga datos de prueba (Team Coronel, 6 jugadores, 2 torneos)
npm run test                # corre los tests del motor de brackets
npm run dev                  # levanta la app en localhost:3000
```

Con el seed cargado podés entrar como jugador con `facu_gg@torneame.demo` /
`demo1234` (o cualquiera de los otros 5 jugadores de prueba) y ver el
torneo, el bracket, el ranking y el dashboard con datos reales — no hace
falta cargar nada a mano para probarlo.

## Deploy sin usar la terminal

El script `build` corre `prisma db push` antes de compilar, a propósito:
así Vercel crea y actualiza las tablas solo en cada deploy, sin que haga
falta abrir una terminal local para correr migraciones. Es el approach
correcto para un proyecto chico/solo — si el día de mañana el equipo
crece y hay varias personas tocando el schema al mismo tiempo, ahí sí
conviene pasar a `prisma migrate` con migraciones versionadas en vez de
`db push`, pero eso es un problema de más adelante, no de ahora.

## Próximo en el roadmap de código

Los ítems que antes figuraban acá (webhook de Mercado Pago, wizard de creación
de torneo, dashboard de organizador, fase de grupos, perfil de jugador
público) ya están implementados — ver "Estado actual" y "V1 del roadmap"
arriba. Lo que queda pendiente de verdad:

1. **CSP en modo bloqueante** — `next.config.js` ya tiene la
   `Content-Security-Policy` armada dominio por dominio, pero corre en
   modo `Report-Only` a propósito (ver el comentario ahí). Pasarla a
   bloqueante una vez confirmada unos días en producción sin reportes
   inesperados (ver paso 9 de `DEPLOY.md`).

## Pagos: inscripciones por transferencia directa, plan PRO por Mercado Pago

Dos flujos de pago separados, a propósito:

- **Inscripción a torneos** (jugador → organizador): NO pasa por Mercado
  Pago ni por Torneame. El organizador carga su alias/CBU en su perfil
  (`OrganizerProfile.paymentAlias`, editable desde `/organizador/dashboard`
  o al crear el perfil). El jugador transfiere directo y sube el
  comprobante (`ImageUploader` a Cloudinary) al inscribirse
  (`app/torneos/[slug]/RegisterButton.tsx` → `registerForTournament` en
  `app/actions/registrations.ts`), quedando en `Payment.status = PENDING`.
  El organizador revisa el comprobante contra su cuenta desde
  `/organizador/pagos` y aprueba o rechaza a mano (`confirmPayment`) —
  ahí recién se confirma el lugar en el torneo. Torneame no cobra
  comisión sobre esto ni toca esa plata en ningún momento.
- **Plan PRO** (organizador → Torneame): sigue con Mercado Pago de
  verdad, vía `PreApproval` (suscripción recurrente) en
  `app/actions/plan.ts` — esto es lo único que nos paga a nosotros.

El webhook de Mercado Pago (`app/api/webhooks/mercadopago/route.ts`) quedó
angosto a propósito: ya no confirma inscripciones a torneo, solo pedidos
de la tienda de merchandising (que sí sigue cobrándose con Mercado Pago).

## IA (Google Gemini, gratis)

Dos funciones puntuales en `app/actions/ai.ts`, ambas opcionales — sin
`GEMINI_API_KEY` configurada tiran un error controlado pero no rompen el
resto de la app:

- **Texto para compartir el torneo** — en la página pública del torneo,
  el organizador (dueño) ve un botón que genera un mensaje listo para
  pegar en WhatsApp/redes, con los datos reales del torneo
  (`TournamentPitchGenerator.tsx`). Ayuda a conseguir más inscriptos sin
  que el organizador tenga que redactarlo.
- **Asistencia para revisar comprobantes** — en `/organizador/pagos`, un
  botón manda la imagen del comprobante a Gemini (que lee imágenes,
  no solo texto) para que compare el monto contra lo esperado y avise si
  parece coincidir. Es una ayuda, no una aprobación automática — el
  organizador sigue siendo quien aprueba o rechaza cada pago a mano.

`GEMINI_API_KEY` se saca gratis en aistudio.google.com (sin tarjeta), con
límite de pedidos por minuto/día — alcanza sobrado para un proyecto chico,
pero no escala infinito gratis si el uso crece mucho.

## Subida de imágenes (Cloudinary)

El flyer del torneo (`app/organizador/torneos/nuevo/NewTournamentWizard.tsx`)
y la foto de perfil (`app/perfil/ProfileForm.tsx`) ya suben el archivo de
verdad en vez de pedir pegar un link — usa `app/components/ImageUploader.tsx`,
que sube directo del navegador a Cloudinary con una firma de un solo uso
generada por `app/actions/cloudinary.ts` (el archivo nunca pasa por
nuestro servidor, y el API secret de Cloudinary nunca se expone al
cliente — solo la firma, que no es reversible). Necesita
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`
en el entorno — ver `.env.example` y el paso 4 de `DEPLOY.md`.

## Auditoría y correcciones de esta vuelta

Revisando el proyecto completo encontré y corregí 3 huecos reales:

- **Colores inconsistentes**: varias pantallas usaban clases de Tailwind pensadas para modo claro (`bg-red-100 text-red-700`) sobre un fondo 100% oscuro — se veían como parches fuera de lugar. Agregué tokens semánticos (`--bg-danger`, `--text-success`, `--text-warning`, etc.) a `globals.css` y los apliqué en todo el proyecto.
- **`assertSameOrigin()` (la capa extra de CSRF) estaba creada pero nunca conectada a ningún server action** — quedó como código muerto desde que la armamos. Ahora está llamada en `registerForTournament`, `createTournament`, `createProduct`, `buyProduct`, `startProSubscription` y `addSponsor` — las acciones que mueven plata o publican contenido en nombre del organizador.
- **Nunca existió un `next.config.js`** — lo creé con cabeceras de seguridad HTTP (`X-Frame-Options` contra clickjacking, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` desactivando cámara/micrófono/geolocalización que la app no usa). Nota: no agregué `Content-Security-Policy` todavía — con imágenes externas (QR de Mercado Pago, logos de sponsors, fotos de productos), fuentes de Google y estilos inline en varios componentes, una CSP mal armada rompe cosas reales sin que yo pueda probarla en este entorno; queda como próximo paso, no lo quise adivinar.

Verificación hecha (sin poder correr `next build` real, por las limitaciones de red de este entorno):
- Todos los imports `@/...` del proyecto resuelven a un archivo que existe de verdad (chequeado con un script, no a ojo).
- El schema de Prisma tiene las llaves balanceadas y ningún modelo duplicado (19 modelos en total).
- Se re-corrieron todas las validaciones de lógica del día (motor de brackets, premio dinámico, sorteo de equipos, sugerencias) y siguen dando los resultados esperados.

Ver `DEPLOY.md` para la guía de deploy completa, sin necesitar terminal.

## Corrección grave — faltaban 3 archivos de configuración fundamentales

Nunca habían existido `tailwind.config.js`, `postcss.config.js` ni `tsconfig.json` en el repo. Esto significaba que:
- **Tailwind nunca generó una sola clase de CSS real** — todo el sitio se veía sin estilos (sin fondo oscuro, sin espaciados, sin colores). Es la causa de "el diseño está mal" que reportaste.
- Los tokens de color custom del proyecto (`bg-surface-1`, `text-secondary`, `text-accent`, `border-strong`, etc. — usados en prácticamente todos los componentes) nunca tuvieron una definición real detrás.
- La animación del fondo (`animate-float-1`/`animate-float-2` en `AnimatedBackground.tsx`) tenía un comentario diciendo "agregar esto en tailwind.config.js" que nunca se pudo cumplir porque el archivo no existía — la animación estaba escrita pero nunca corría.
- El alias `@/` que se usa en cientos de imports (`@/lib/prisma`, `@/app/...`) dependía de que Next.js lo adivinara solo sin `tsconfig.json`, lo cual no es confiable.

Se crearon los 3 archivos, mapeando con precisión (revisando con grep qué clases se usan de verdad en el código, no una lista genérica) cada token de color a su variable CSS correspondiente en `globals.css`. También se corrigió `bg-primary/10` y `bg-accent/30` (con modificador de opacidad), que necesitan el color declarado como tripleta RGB (`--primary-rgb: 124 92 252`) en vez de hexadecimal para que Tailwind pueda aplicarles opacidad correctamente.

También se corrigió `app/manifest.ts`: el sistema de metadata dinámica de Next.js rompía en Windows si la ruta del proyecto tenía un apóstrofo (ej. una carpeta de usuario tipo `Users\Nombre' PC\`). Se reemplazó por un `public/manifest.webmanifest` estático, que no depende de ese loader y funciona igual en cualquier entorno.

## Segunda auditoría — 3 bugs más, mismo patrón (rompían solo en el build real)

- **`headers()` sin `await`** en `lib/security.ts` (`assertSameOrigin`, la capa de CSRF) — Next.js 15 también volvió asíncrona esta función, igual que hizo con `params`. Se corrigió la función y los 6 lugares donde se llama.
- **`session.user.role`/`.id` sin tipos declarados** — se usan en 33 lugares del proyecto pero nunca existió el archivo de declaración que le dice a TypeScript que esos campos existen en la sesión de NextAuth. Se agregó `types/next-auth.d.ts`.
- **`session.user.id` nunca se copiaba del JWT a la sesión** (bug de funcionamiento, no de compilación — esto iba a compilar bien pero fallar en producción con `id` siempre `undefined`). Corregido en `auth.ts`.
- Se agregó `.eslintrc.json` (no existía) y se re-verificó todo el proyecto con una batería de 7 chequeos automáticos: JSON válidos, configs de JS cargan, schema de Prisma balanceado, imports resueltos, sin sintaxis vieja de `params`, `headers()`/`cookies()` siempre con `await`, `assertSameOrigin()` siempre con `await`.

## Tercera vuelta — el flujo de punta a punta tenía huecos reales

El nav de la landing linkeaba a páginas que nunca se habían construido. Se encontraron y armaron:

- **`/registro`** — no existía ninguna pantalla, aunque la función `registerUser` y los links del nav ya apuntaban ahí. Incluye auto-login después de crear la cuenta.
- **`/organizador/perfil/nuevo`** y **`/jugador/perfil/nuevo`** — el segundo paso del alta (completar el perfil) tampoco existía.
- **`/torneos`** — el listado público de TODOS los torneos (visible para cualquiera, no solo usuarios logueados) no existía. Ahora muestra la imagen de cada torneo.
- **`/organizadores`** — listado público de todos los organizadores, tampoco existía.
- **`/admin`** — el panel de administrador no existía del todo. Ahora tiene: stats generales (jugadores, organizadores, recaudación, comisión), lista de organizadores con botón para dar/sacar el plan PRO a mano (separado del flujo pago real de Mercado Pago, para cortesías o casos especiales), y los últimos 30 pagos aprobados de toda la plataforma.
- **Las imágenes de los torneos**: el modelo `Tournament` nunca tuvo un campo para esto. Se agregó `bannerImageUrl`, se conectó en el wizard de creación (por ahora se pega un link, no se sube el archivo directo — ver nota abajo), y se muestra en la landing, en `/torneos` y en la página individual del torneo. Si no hay imagen cargada, se muestra un bloque con el nombre del juego en vez de un hueco vacío.
- Se agregó un usuario **admin de prueba** al seed (`admin@torneame.demo` / `demo1234`), porque no había forma de probar el panel nuevo sin esto.
- Se corrigió sobre la marcha un parche feo que yo mismo había escrito (un `.catch()` con `as never` para esquivar que `OrganizerProfile` no tenía `createdAt`) — se agregó el campo de verdad al schema en vez de esquivar el problema.

**Actualización**: la carga de imágenes ahora sube el archivo de verdad a Cloudinary en vez de pedir pegar un link — ver la sección "Subida de imágenes (Cloudinary)" más abajo.
