"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTournament } from "@/app/actions/bracket";
import { useToast } from "@/app/components/Toast";

export function StartTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      try {
        await startTournament(tournamentId);
        toast("¡Bracket generado! Ya se pueden cargar resultados.", "success");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo generar el bracket";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleStart}
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Generando bracket..." : "Generar bracket y arrancar torneo"}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
