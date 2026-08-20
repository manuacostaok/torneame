import { PowerMushroomIcon, VersusIcon, SpeedyCritterIcon } from "./icons/GamerIcons";

// Fondo estilo arcade — reemplazó al viejo fondo de círculos difuminados.
// Todo CSS/SVG puro (sin canvas, sin JS en el hilo principal), respeta
// prefers-reduced-motion. Tratamiento "juguete 3D" (gradientes + brillos
// + sombra proyectada) para que se vea pulido y llamativo. A propósito,
// todo son diseños 100% ORIGINALES del género (un comegalletas amarillo,
// fantasmitas, una criatura veloz, cajas de consola, joysticks de
// distinta pinta, un power-up, un versus de pelea) — ninguno reproduce el
// diseño de un personaje o consola con nombre puntual, mismo criterio que
// ya usa el proyecto en JoystickLogo.tsx y GalaxianBackground.tsx.

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
// contenido central (más cargadas en los bordes). Opacidad más alta que
// antes a propósito: "llamativo" fue pedido explícito.
const GAMER_ICONS: {
  Icon: (props: { className?: string }) => React.ReactElement;
  style: React.CSSProperties;
}[] = [
  {
    Icon: HandheldIcon,
    style: { top: "8%", left: "4%", width: 34, opacity: 0.32, animationDuration: "7s" },
  },
  {
    Icon: PadControllerIcon,
    style: { top: "18%", right: "6%", width: 42, opacity: 0.3, animationDuration: "8.5s" },
  },
  {
    Icon: ConsoleIcon,
    style: { bottom: "10%", left: "8%", width: 44, opacity: 0.3, animationDuration: "9s" },
  },
  {
    Icon: TwinStickControllerIcon,
    style: { bottom: "16%", right: "5%", width: 40, opacity: 0.3, animationDuration: "7.5s" },
  },
  {
    Icon: CartridgeIcon,
    style: { top: "45%", left: "2%", width: 22, opacity: 0.26, animationDuration: "6.5s" },
  },
  {
    Icon: PadControllerIcon,
    style: { top: "50%", right: "3%", width: 30, opacity: 0.22, animationDuration: "8s" },
  },
  {
    Icon: PowerMushroomIcon,
    style: { top: "34%", left: "6%", width: 30, opacity: 0.3, animationDuration: "7.2s" },
  },
  {
    Icon: VersusIcon,
    style: { top: "56%", right: "8%", width: 48, opacity: 0.28, animationDuration: "9.5s" },
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
        <div key={i} className="gamer-icon" style={style}>
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
        >
          <SpeedyCritterIcon className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

// --- Siluetas 3D genéricas de consolas/joysticks (gradiente + brillo) ---

function HandheldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" fill="none" className={className}>
      <defs>
        <linearGradient id="hh-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a597ff" />
          <stop offset="100%" stopColor="#5a3fd6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="56" rx="6" fill="url(#hh-body)" />
      <rect x="8" y="8" width="24" height="18" rx="1.5" fill="#0b0e14" opacity="0.55" />
      <path d="M14 38h-4M12 36v4" stroke="#0b0e14" strokeWidth={2} strokeLinecap="round" opacity="0.6" />
      <circle cx="27" cy="36" r="2" fill="#0b0e14" opacity="0.6" />
      <circle cx="32" cy="40" r="2" fill="#0b0e14" opacity="0.6" />
      <rect x="4" y="4" width="10" height="6" rx="3" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function ConsoleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 26" fill="none" className={className}>
      <defs>
        <linearGradient id="cn-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e5e9f2" />
          <stop offset="100%" stopColor="#8a93a6" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="24" rx="5" fill="url(#cn-body)" />
      <circle cx="16" cy="13" r="6" fill="#0b0e14" opacity="0.5" />
      <path d="M28 13h30" stroke="#0b0e14" strokeWidth={1.6} strokeLinecap="round" opacity="0.5" />
      <circle cx="54" cy="8" r="1.6" fill="#7c5cfc" />
      <circle cx="58" cy="8" r="1.6" fill="#00d9c0" />
      <rect x="4" y="3" width="20" height="4" rx="2" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function PadControllerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" fill="none" className={className}>
      <defs>
        <linearGradient id="pc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#00a893" />
        </linearGradient>
      </defs>
      <path
        d="M12 8 Q3 8 2 18 Q1 28 8 30 Q13 32 17 25 L21 20 L39 20 L43 25 Q47 32 52 30 Q59 28 58 18 Q57 8 48 8 Z"
        fill="url(#pc-body)"
      />
      <path d="M14 15v8M10 19h8" stroke="#0b0e14" strokeWidth={1.8} strokeLinecap="round" opacity="0.55" />
      <circle cx="45" cy="14" r="1.8" fill="#0b0e14" opacity="0.55" />
      <circle cx="50" cy="18" r="1.8" fill="#0b0e14" opacity="0.55" />
      <circle cx="45" cy="22" r="1.8" fill="#0b0e14" opacity="0.55" />
      <circle cx="40" cy="18" r="1.8" fill="#0b0e14" opacity="0.55" />
      <ellipse cx="16" cy="12" rx="6" ry="3" fill="#fff" opacity="0.3" />
    </svg>
  );
}

function TwinStickControllerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 34" fill="none" className={className}>
      <defs>
        <linearGradient id="ts-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <path
        d="M14 6h32 Q56 6 56 18 Q56 30 47 28 L40 22 H20 L13 28 Q4 30 4 18 Q4 6 14 6 Z"
        fill="url(#ts-body)"
      />
      <circle cx="20" cy="16" r="4.5" fill="#0b0e14" opacity="0.5" />
      <circle cx="40" cy="16" r="4.5" fill="#0b0e14" opacity="0.5" />
      <path d="M10 4h6M46 4h6" stroke="#0b0e14" strokeWidth={1.6} strokeLinecap="round" opacity="0.5" />
      <ellipse cx="18" cy="10" rx="8" ry="3" fill="#fff" opacity="0.3" />
    </svg>
  );
}

function CartridgeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 40" fill="none" className={className}>
      <defs>
        <linearGradient id="ct-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#c98a00" />
        </linearGradient>
      </defs>
      <path d="M4 2h22a2 2 0 0 1 2 2v10H2V4a2 2 0 0 1 2-2Z" fill="#7c5cfc" />
      <rect x="2" y="14" width="26" height="24" rx="2" fill="url(#ct-body)" />
      <path d="M9 20v12M15 20v12M21 20v12" stroke="#0b0e14" strokeWidth={1.6} opacity="0.4" />
    </svg>
  );
}
