"use client";

import { useEffect, useRef } from "react";
import { animate, stagger, utils } from "animejs";

// Reemplaza a la vieja grilla estática (.maze-grid) — no encajaba con el
// resto del fondo arcade (fantasmitas, joysticks, naves). Un campo de
// estrellas titilando encaja con la ambientación "espacio/arcade" que ya
// tienen GalaxianBackground y los íconos de PacmanBackground, y da
// sensación de profundidad en vez de una cuadrícula plana.
const STAR_COUNT = 70;

export function Starfield({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const stars = container.querySelectorAll(".star");
    // Cada estrella titila entre su opacidad base y un valor random propio,
    // con duración y arranque escalonados por estrella (stagger) — así el
    // cielo se ve vivo en vez de parpadear todo sincronizado, que se nota
    // claramente artificial.
    const twinkle = animate(stars, {
      opacity: () => utils.random(15, 90, 0) / 100,
      duration: () => utils.random(1400, 3200),
      delay: stagger(30),
      loop: true,
      alternate: true,
      ease: "inOutSine",
    });

    return () => {
      twinkle.pause();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const size = 1 + ((i * 7) % 3);
        const top = (i * 13.7) % 100;
        const left = (i * 29.3) % 100;
        return (
          <span
            key={i}
            className="star absolute rounded-full bg-white"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: size,
              height: size,
              opacity: 0.3,
            }}
          />
        );
      })}
    </div>
  );
}
