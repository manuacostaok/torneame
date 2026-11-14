"use client";

import { useEffect, useState } from "react";
import { DQ_TIMER_MINUTES } from "@/lib/tournamentConfig";

/** Cuenta regresiva desde que se convocó a los jugadores hasta que se los puede descalificar por ausencia. */
export function DQCountdown({ calledAt }: { calledAt: string }) {
  const deadline = new Date(calledAt).getTime() + DQ_TIMER_MINUTES * 60_000;
  const [remainingMs, setRemainingMs] = useState(() => deadline - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemainingMs(deadline - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const expired = remainingMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <span className={expired ? "font-medium text-[var(--text-danger)]" : "text-secondary"}>
      {expired ? "Tiempo cumplido — se puede descalificar" : `Tiempo para presentarse: ${minutes}:${seconds}`}
    </span>
  );
}
