"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { JoystickLogo } from "./JoystickLogo";
import { GalaxianBackground } from "./GalaxianBackground";

const APP_NAME = "Torneame";
const TYPE_SPEED_MS = 140;
const CABLE_LENGTH = 170;

export function LoginModal({ children }: { children: React.ReactNode }) {
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (typedChars >= APP_NAME.length) return;
    const timeout = setTimeout(() => setTypedChars((c) => c + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timeout);
  }, [typedChars]);

  const progress = typedChars / APP_NAME.length;
  const finishedTyping = typedChars >= APP_NAME.length;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GalaxianBackground />

      <div className="relative w-full max-w-sm rounded-2xl border border-strong/40 bg-surface-1/95 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex flex-col items-center text-center">
          <JoystickLogo
            progress={progress}
            size={64}
            className="text-white"
            style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.85))" }}
          />

          {/* Título blanco, fuente pixel de arcade retro (Press Start 2P),
              con sombra dura para que no se lave contra el fondo animado */}
          <h1
            className="mt-3 flex text-xl text-white"
            style={{
              fontFamily: "var(--font-pixel)",
              textShadow: "0 2px 0 rgba(0,0,0,0.9), 0 4px 10px rgba(0,0,0,0.6)",
            }}
          >
            {APP_NAME.split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14, scale: 0.6, rotate: -8 }}
                animate={
                  i < typedChars
                    ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
                    : { opacity: 0, y: 14, scale: 0.6, rotate: -8 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 14 }}
              >
                {letter}
              </motion.span>
            ))}
            {!finishedTyping && <span className="ml-0.5 animate-pulse">|</span>}
          </h1>

          {/* Subrayado = cable que sale del logo y termina en un plug */}
          <svg width={CABLE_LENGTH} height="22" viewBox="0 0 170 22" className="mt-2 text-white">
            <path
              d="M4 4 Q 30 18 55 6 T 110 8 T 150 6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={200}
              strokeDashoffset={200 * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.12s linear" }}
            />
            <g style={{ opacity: progress > 0.85 ? 1 : 0, transition: "opacity 0.2s ease" }}>
              <rect x="150" y="1" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.6} />
              <path d="M164 4 L169 4 M164 8 L169 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
            </g>
          </svg>

          {/* Subtítulo gris */}
          <p className="mt-3 text-sm text-secondary">Tu torneo, sin el quilombo.</p>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
