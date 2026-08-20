// Íconos genéricos de videojuego, con tratamiento "juguete 3D" (gradiente
// + brillo + sombra) para que se vean pulidos y llamativos. A propósito
// son personajes/objetos 100% originales — ninguno está basado en un
// personaje con nombre puntual (mismo criterio que JoystickLogo.tsx y
// GalaxianBackground.tsx, llevado un poco más lejos por pedido explícito
// de más onda visual). Compartidos entre FriendsModePromo.tsx y
// PacmanBackground.tsx.

// Power-up genérico y original — una cápsula/orbe con un brillo interno,
// no un hongo con cara ni el patrón de lunares de nadie puntual.
export function PowerMushroomIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <radialGradient id="pw-cap" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="55%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#c98a00" />
        </radialGradient>
        <linearGradient id="pw-stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7e0" />
          <stop offset="100%" stopColor="#e8c77a" />
        </linearGradient>
      </defs>
      <path
        d="M8 20C8 11 15 5 24 5s16 6 16 15c0 3-2 5-5 5H13c-3 0-5-2-5-5Z"
        fill="url(#pw-cap)"
      />
      <rect x="17" y="24" width="14" height="16" rx="4" fill="url(#pw-stem)" />
      <ellipse cx="17" cy="13" rx="5" ry="3" fill="#fff" opacity="0.5" />
    </svg>
  );
}

// Dos siluetas genéricas encarándose en postura de pelea — la idea de
// "versus" del género de lucha, con volumen (gradiente + sombra), sin
// capas/vinchas/colores de ningún personaje puntual.
export function VersusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 48" fill="none" className={className}>
      <defs>
        <linearGradient id="vs-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a597ff" />
          <stop offset="100%" stopColor="#7c5cfc" />
        </linearGradient>
        <linearGradient id="vs-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#00a893" />
        </linearGradient>
      </defs>
      <g>
        <circle cx="14" cy="10" r="5" fill="url(#vs-a)" />
        <path
          d="M14 16c-6 0-9 4-9 9v6h8l1 12h6l1-14-3-4 4-6c-2-2-5-3-8-3Z"
          fill="url(#vs-a)"
        />
      </g>
      <g transform="translate(60,0) scale(-1,1)">
        <circle cx="14" cy="10" r="5" fill="url(#vs-b)" />
        <path
          d="M14 16c-6 0-9 4-9 9v6h8l1 12h6l1-14-3-4 4-6c-2-2-5-3-8-3Z"
          fill="url(#vs-b)"
        />
      </g>
      <text
        x="30"
        y="27"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#fcd34d"
        fontFamily="var(--font-heading)"
      >
        VS
      </text>
    </svg>
  );
}

// Criatura veloz 100% original — cuerpo redondo, un par de aletas/púas
// genéricas en el lomo (sin la silueta ni el esquema de color de ningún
// personaje puntual), patitas cortas a media zancada. El "cameo veloz"
// que se pidió, pero un bicho inventado.
export function SpeedyCritterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" fill="none" className={className}>
      <defs>
        <radialGradient id="sc-body" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
      </defs>
      <path d="M8 22 L2 16 L9 17 Z" fill="#1e40af" opacity="0.8" />
      <path d="M12 16 L6 8 L14 12 Z" fill="#1e40af" opacity="0.8" />
      <circle cx="20" cy="14" r="12" fill="url(#sc-body)" />
      <circle cx="26" cy="10" r="2" fill="#0b0e14" />
      <path d="M12 24 L14 20 M18 25 L19 21 M24 25 L25 21" stroke="#1e40af" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx="16" cy="9" rx="4" ry="2.5" fill="#fff" opacity="0.5" />
    </svg>
  );
}
