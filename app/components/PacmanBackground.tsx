// Reemplaza al viejo AnimatedBackground (los círculos difuminados, "el
// fondo de pelotas") por algo con onda de videojuego de verdad — CSS puro
// (sin canvas ni JS corriendo en el hilo principal), respeta
// prefers-reduced-motion igual que el anterior. Colores de la marca, no
// los amarillo/celeste genéricos del arcade original.
const LANES = [
  { top: "12%", duration: "9s", delay: "0s", ghost: false },
  { top: "38%", duration: "13s", delay: "-4s", ghost: true, ghostColor: "#7c5cfc" },
  { top: "64%", duration: "10.5s", delay: "-7s", ghost: false },
  { top: "88%", duration: "15s", delay: "-2s", ghost: true, ghostColor: "#00d9c0" },
];

export function PacmanBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className}`}
      aria-hidden="true"
    >
      {LANES.map((lane, i) => (
        <div key={i} className="absolute left-0 right-0" style={{ top: lane.top }}>
          <div className="dots-trail" />
          {lane.ghost ? (
            <div
              className="ghost-sprite"
              style={{
                backgroundColor: lane.ghostColor,
                animationDuration: lane.duration,
                animationDelay: lane.delay,
              }}
            />
          ) : (
            <div
              className="pacman-sprite"
              style={{ animationDuration: `0.35s, ${lane.duration}`, animationDelay: `0s, ${lane.delay}` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
