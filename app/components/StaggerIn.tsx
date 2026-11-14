"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

/**
 * Envuelve contenido ya renderizado en el servidor y anima la entrada de
 * sus hijos directos (fade + slide-up, escalonado) al montar en el
 * cliente. No pisa el data-fetching de la página — los hijos pueden ser
 * Server Components normales, esto solo agrega el efecto de entrada
 * encima. Respeta prefers-reduced-motion (los deja visibles, sin animar).
 */
export function StaggerIn({
  children,
  className = "",
  staggerMs = 80,
  startDelay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  startDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = Array.from(el.children);
    if (items.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const entrance = animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
      delay: stagger(staggerMs, { start: startDelay }),
      ease: "outQuad",
    });

    return () => {
      entrance.pause();
    };
  }, [staggerMs, startDelay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
