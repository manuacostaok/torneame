"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

/** Anima un número contando desde 0 hasta el valor real al montar — para los números de stats (recaudado, inscriptos, etc). */
export function CountUp({
  value,
  prefix = "",
  locale = "es-AR",
}: {
  value: number;
  prefix?: string;
  locale?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = prefix + value.toLocaleString(locale);
      return;
    }

    const counter = { n: 0 };
    const anim = animate(counter, {
      n: value,
      duration: 900,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = prefix + Math.round(counter.n).toLocaleString(locale);
      },
    });

    return () => {
      anim.pause();
    };
  }, [value, prefix, locale]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString(locale)}
    </span>
  );
}
