"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Ciclo corto de estados que muestra el valor central del producto sin
// que el visitante tenga que crear una cuenta para verlo: el bracket se
// arma y se actualiza solo, a diferencia del papel y lapicera actual.
const DEMO_STEPS = [
  { round: 1, label: "Facu vs Gaby" },
  { round: 1, label: "Facu gana 2–0" },
  { round: 2, label: "Facu vs Nico" },
  { round: 2, label: "Facu gana 2–1" },
  { round: 3, label: "🏆 Facu, campeón" },
];

export function BracketDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % DEMO_STEPS.length), 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-xs rounded-xl bg-surface-1 p-5 text-center">
      <p className="text-xs text-muted">Así se arma solo, en vivo</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-3 text-lg font-medium"
        >
          {DEMO_STEPS[step].label}
        </motion.p>
      </AnimatePresence>
      <p className="mt-2 text-xs text-secondary">Ronda {DEMO_STEPS[step].round} de 3</p>
    </div>
  );
}
