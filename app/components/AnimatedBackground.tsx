// Fondo animado reutilizable en toda la app: landing, página de torneo, etc.
// CSS puro (transform + keyframes) por performance — nada de JS corriendo
// en el hilo principal para esto. Respeta prefers-reduced-motion.
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-accent/30 blur-0 motion-safe:animate-float-1" />
      <div className="absolute bottom-4 -right-12 h-44 w-44 rounded-full bg-purple-500/25 motion-safe:animate-float-2" />
      <div className="absolute top-1/2 left-1/2 h-36 w-36 rounded-full bg-amber-400/15 motion-safe:animate-float-1 [animation-direction:reverse]" />
    </div>
  );
}

/*
Agregar en tailwind.config.js:

keyframes: {
  "float-1": { "0%,100%": { transform: "translate(0,0)" }, "50%": { transform: "translate(20px,25px)" } },
  "float-2": { "0%,100%": { transform: "translate(0,0)" }, "50%": { transform: "translate(-25px,-15px)" } },
},
animation: {
  "float-1": "float-1 9s ease-in-out infinite",
  "float-2": "float-2 11s ease-in-out infinite",
},
*/
