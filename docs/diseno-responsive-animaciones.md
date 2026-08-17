# Notas de diseño — mobile responsive y animaciones de fondo

## Mobile-first, no "también anda en mobile"
Todo el diseño se construye primero para 375px de ancho (el mockup que viste) y se expande hacia desktop con breakpoints de Tailwind (`sm:`, `md:`, `lg:`), no al revés. Es la forma correcta dado que la mayoría de los jugadores van a descubrir un torneo desde una historia o post de Instagram en el celular, no desde una compu.

## Animaciones de fondo — implementación real en Next.js
El mockup que viste usa CSS puro (`@keyframes` + `transform`) a propósito: es la técnica más liviana en performance — no depende de JS, no bloquea el hilo principal, y corre en la GPU. En el código real:

- **Blobs de fondo animados**: mismo enfoque, CSS puro con `transform: translate()`, nunca animando `width`/`height`/`top`/`left` directamente (eso fuerza reflow y rompe la fluidez).
- **Micro-interacciones de UI** (botones, cards, transiciones entre pantallas, el bracket actualizándose en vivo): ahí sí usamos **Framer Motion**, que ya está en el stack — es mejor para animaciones que dependen de estado de React (ej. un partido que pasa de "pendiente" a "en vivo" con una transición suave).
- **Accesibilidad**: todas las animaciones respetan `prefers-reduced-motion` — si el usuario tiene esa preferencia activada en su sistema, los blobs de fondo quedan estáticos automáticamente. Esto no es opcional, es un estándar mínimo de UX moderno.

## Performance en mobile
Con conexiones 4G variables (muy común en el público que va a usar esto desde una feria o un local), la landing tiene que cargar rápido igual. Por eso:
- Los blobs de fondo son `div`s con `border-radius: 50%` y color plano, no imágenes ni SVGs pesados.
- Next.js con SSG/ISR para la landing y las páginas públicas de torneo (no necesitan datos en tiempo real hasta que el torneo arranca).
- Bracket en vivo: ahí sí hace falta actualización en tiempo real — se resuelve con polling liviano o Server-Sent Events en vez de un socket persistente, que es innecesario para el volumen de partidos simultáneos que va a tener un torneo típico.
