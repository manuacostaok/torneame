// Íconos genéricos de videojuego — a propósito genéricos, no reproducen
// el diseño protegido de ningún personaje puntual (mismo criterio que
// JoystickLogo.tsx y GalaxianBackground.tsx). Compartidos entre
// FriendsModePromo.tsx y PacmanBackground.tsx.

// Power-up genérico (no el hongo puntual de Mario — sin ojos, sin el
// patrón de lunares blancos sobre rojo característico, un solo color
// plano) — la idea de "power-up" del género, no un personaje de nadie.
export function PowerMushroomIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M8 20C8 11 15 5 24 5s16 6 16 15c0 3-2 5-5 5H13c-3 0-5-2-5-5Z"
        fill="currentColor"
      />
      <rect x="17" y="24" width="14" height="16" rx="4" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

// Dos siluetas genéricas encarándose en postura de pelea — la idea de
// "versus" del género de lucha, sin capas/vinchas/colores de ningún
// personaje puntual.
export function VersusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 48" fill="none" className={className}>
      <g>
        <circle cx="14" cy="10" r="5" fill="currentColor" />
        <path
          d="M14 16c-6 0-9 4-9 9v6h8l1 12h6l1-14-3-4 4-6c-2-2-5-3-8-3Z"
          fill="currentColor"
        />
      </g>
      <g transform="translate(60,0) scale(-1,1)">
        <circle cx="14" cy="10" r="5" fill="currentColor" />
        <path
          d="M14 16c-6 0-9 4-9 9v6h8l1 12h6l1-14-3-4 4-6c-2-2-5-3-8-3Z"
          fill="currentColor"
        />
      </g>
      <text
        x="30"
        y="27"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--font-heading)"
      >
        VS
      </text>
    </svg>
  );
}
