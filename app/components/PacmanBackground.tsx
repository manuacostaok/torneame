// Fondo estilo arcade — reemplazó al viejo fondo de círculos difuminados.
// Todo CSS/SVG puro (sin canvas, sin JS en el hilo principal), respeta
// prefers-reduced-motion. A propósito, todo son siluetas GENÉRICAS del
// género (un comegalletas amarillo, fantasmitas, un corredor veloz, cajas
// de consola, joysticks de distinta pinta) — ninguna reproduce el diseño
// protegido de un personaje o consola puntual, mismo criterio que ya usa
// el proyecto en JoystickLogo.tsx y GalaxianBackground.tsx.

// Carril "de caza": un comegalletas con 3 fantasmas seudo-persiguiéndolo
// (mismo recorrido, delays negativos escalonados para que se vean en fila).
const CHASE_GHOSTS = [
  { color: "#ef4444", delay: "-1.1s" },
  { color: "#00d9c0", delay: "-2.3s" },
  { color: "#f472b6", delay: "-3.4s" },
];

const SOLO_LANES = [
  { top: "62%", duration: "11s", delay: "-5s", ghost: true, color: "#7c5cfc" },
  { top: "80%", duration: "9.5s", delay: "-2s", ghost: false },
];

const RUNNERS = [
  { top: "28%", duration: "3.2s", delay: "1s" },
  { top: "71%", duration: "3.8s", delay: "6s" },
];

// Siluetas de consolas/joysticks — genéricas, sin logos ni formas exactas
// de ningún fabricante. Coordenadas fijas pensadas para no pisar el
// contenido central (más cargadas en los bordes).
const GAMER_ICONS: {
  Icon: (props: { className?: string }) => React.ReactElement;
  style: React.CSSProperties;
}[] = [
  {
    Icon: HandheldIcon,
    style: { top: "8%", left: "4%", width: 34, opacity: 0.16, animationDuration: "7s" },
  },
  {
    Icon: PadControllerIcon,
    style: { top: "18%", right: "6%", width: 42, opacity: 0.14, animationDuration: "8.5s" },
  },
  {
    Icon: ConsoleIcon,
    style: { bottom: "10%", left: "8%", width: 44, opacity: 0.14, animationDuration: "9s" },
  },
  {
    Icon: TwinStickControllerIcon,
    style: { bottom: "16%", right: "5%", width: 40, opacity: 0.15, animationDuration: "7.5s" },
  },
  {
    Icon: CartridgeIcon,
    style: { top: "45%", left: "2%", width: 22, opacity: 0.12, animationDuration: "6.5s" },
  },
  {
    Icon: PadControllerIcon,
    style: { top: "50%", right: "3%", width: 30, opacity: 0.1, animationDuration: "8s" },
  },
];

export function PacmanBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className}`}
      aria-hidden="true"
    >
      <div className="maze-grid" />

      {GAMER_ICONS.map(({ Icon, style }, i) => (
        <div key={i} className="gamer-icon text-secondary" style={style}>
          <Icon />
        </div>
      ))}

      {/* Carril de caza: Pac-Man + 3 fantasmas en fila */}
      <div className="absolute left-0 right-0" style={{ top: "20%" }}>
        <div className="dots-trail" />
        <div className="pacman-sprite" style={{ animationDuration: "0.35s, 12s" }} />
        {CHASE_GHOSTS.map((g, i) => (
          <div
            key={i}
            className="ghost-sprite"
            style={{ backgroundColor: g.color, animationDuration: "12s", animationDelay: g.delay }}
          />
        ))}
      </div>

      {SOLO_LANES.map((lane, i) => (
        <div key={i} className="absolute left-0 right-0" style={{ top: lane.top }}>
          <div className="dots-trail" />
          {lane.ghost ? (
            <div
              className="ghost-sprite"
              style={{
                backgroundColor: lane.color,
                animationDuration: lane.duration,
                animationDelay: lane.delay,
              }}
            />
          ) : (
            <div
              className="pacman-sprite"
              style={{
                animationDuration: `0.35s, ${lane.duration}`,
                animationDelay: `0s, ${lane.delay}`,
              }}
            />
          )}
        </div>
      ))}

      {RUNNERS.map((r, i) => (
        <div
          key={i}
          className="runner-sprite"
          style={{ top: r.top, animationDuration: r.duration, animationDelay: r.delay }}
        />
      ))}
    </div>
  );
}

// --- Siluetas genéricas de consolas/joysticks, en trazo (currentColor) ---

function HandheldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" fill="none" className={className}>
      <rect x="2" y="2" width="36" height="56" rx="6" stroke="currentColor" strokeWidth={2} />
      <rect x="8" y="8" width="24" height="18" rx="1.5" stroke="currentColor" strokeWidth={2} />
      <path d="M14 38h-4M12 36v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <circle cx="27" cy="36" r="2" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="32" cy="40" r="2" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function ConsoleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 26" fill="none" className={className}>
      <rect x="1" y="1" width="62" height="24" rx="5" stroke="currentColor" strokeWidth={2} />
      <circle cx="16" cy="13" r="6" stroke="currentColor" strokeWidth={1.6} />
      <path d="M28 13h30" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="54" cy="8" r="1.6" fill="currentColor" />
      <circle cx="58" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

function PadControllerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" fill="none" className={className}>
      <path
        d="M12 8 Q3 8 2 18 Q1 28 8 30 Q13 32 17 25 L21 20 L39 20 L43 25 Q47 32 52 30 Q59 28 58 18 Q57 8 48 8 Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M14 15v8M10 19h8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="45" cy="14" r="1.8" fill="currentColor" />
      <circle cx="50" cy="18" r="1.8" fill="currentColor" />
      <circle cx="45" cy="22" r="1.8" fill="currentColor" />
      <circle cx="40" cy="18" r="1.8" fill="currentColor" />
    </svg>
  );
}

function TwinStickControllerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 34" fill="none" className={className}>
      <path
        d="M14 6h32 Q56 6 56 18 Q56 30 47 28 L40 22 H20 L13 28 Q4 30 4 18 Q4 6 14 6 Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx="20" cy="16" r="4.5" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="40" cy="16" r="4.5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M10 4h6M46 4h6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function CartridgeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 40" fill="none" className={className}>
      <path
        d="M4 2h22a2 2 0 0 1 2 2v10H2V4a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth={2}
      />
      <rect x="2" y="14" width="26" height="24" rx="2" stroke="currentColor" strokeWidth={2} />
      <path d="M9 20v12M15 20v12M21 20v12" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}
