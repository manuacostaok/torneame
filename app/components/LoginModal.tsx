"use client";

import { AnimatedLogoLockup } from "./AnimatedLogoLockup";
import { GalaxianBackground } from "./GalaxianBackground";

export function LoginModal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GalaxianBackground />

      <div className="relative w-full max-w-sm rounded-2xl border border-strong/40 bg-surface-1/95 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <AnimatedLogoLockup size={64} titleAs="h1" />

        {/* Subtítulo gris */}
        <p className="mt-3 text-center text-sm text-secondary">Tu torneo, sin el quilombo.</p>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
