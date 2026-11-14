# Torneame — Design System

Fuente de verdad para dirección visual. Leer antes de correr `/design-shotgun`
o `/design-html` de nuevo — evita reabrir decisiones ya tomadas.

## Identidad

Tema oscuro estilo arcade retro (Space Invaders / Pac-Man / Galaxian), 100%
original — ningún sprite reproduce un personaje o consola con nombre puntual.
Los "objetos" (fantasmas, joysticks, naves, Pac-Man, starfield) son elementos
protagonistas que el usuario pidió explícitamente conservar en cualquier
rediseño futuro.

## Tokens (`app/globals.css`)

- Fondo: `--surface-0 #0b0e14`, `--surface-1 #151a23`, `--surface-2 #1c222d`
- Texto: `--text-primary #f5f6fa`, `--text-secondary #8a93a6`, `--text-muted #5f6673`, `--text-accent #a597ff`
- Marca: `--primary`/`--accent #7c5cfc`, teal secundario `#00d9c0`
- Semánticos: `--bg-danger`/`--text-danger`, `--bg-success`/`--text-success`, `--bg-warning`/`--text-warning`
- Borde: `--border-strong #2a3140`

## Tipografía

- `--font-heading`: Space Grotesk (h1-h3)
- Body: Inter
- `--font-pixel`: Press Start 2P — logo, tags "1P"/"2P", acentos puntuales (NUNCA texto largo, es ilegible)
- `--font-mono`: JetBrains Mono — cualquier número "en vivo" (scoreboard, ticker, stats), separa visualmente "esto cambia" de la prosa

## Motion

- `anime.js` v4 para animaciones JS-driven: `StaggerIn` (entrada escalonada, fade+slide-up) y `CountUp` (números que cuentan desde 0)
- CSS puro para loops continuos (ticker, scanline) — no cargar JS para algo que un `@keyframes` resuelve
- Toda animación respeta `prefers-reduced-motion: reduce`
- Fondo: `Starfield` (estrellas titilando) reemplazó a la vieja grilla estática — decisión tomada porque el usuario explícitamente no quería el fondo cuadriculado

## Decisiones activas

### Landing home — puertas 1P/2P + scoreboard CRT (2026-09-10)

Vía `/design-shotgun`: 4 direcciones exploradas (marquee de cabina, scoreboard
CRT, piso de arcade con split de camino, glow mínimo), el usuario pidió una
quinta mezclando **piso de arcade** (los CTA "Soy jugador"/"Quiero organizar"
se vuelven dos puertas grandes estilo selección 1P/2P en vez de dos botones
iguales) + **scoreboard CRT** (fósforo/scanline sutil de fondo, números reales
en mono tabular tratados como elemento hero, ticker horizontal infinito en
vez de grilla estática de tarjetas).

Implementado en `app/page.tsx` + `PathDoors.tsx` + `ScoreboardStrip.tsx` +
`LiveTournamentTicker.tsx`. Los tres números del marcador (premios activos,
jugadores compitiendo, torneos del mes) son reales vía Prisma, no mockeados.

**Por qué:** el usuario valoró explícitamente eliminar la ambigüedad de
"¿cuál botón toco primero?" del hero, y reforzar la sensación de "esto está
vivo" en vez de una landing estática — ambas cosas resueltas por la fusión
en vez de elegir una sola dirección.

**Al reutilizar este patrón:** las puertas 1P/2P son el mecanismo de
selección de rol principal de la home — si se agrega un tercer rol de
usuario en el futuro, no forzarlo a un tercer botón parejo; repensar el
mecanismo de selección en vez de romper la metáfora 1P/2P.
