"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceGroupsToPlayoffs } from "@/app/actions/bracket";
import { useToast } from "@/app/components/Toast";

export function AdvancePlayoffsButton({
  tournamentId,
  disabled,
}: {
  tournamentId: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await advanceGroupsToPlayoffs(tournamentId);
        toast("¡Playoffs armados!", "success");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo armar los playoffs";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Armando playoffs..." : "Avanzar a playoffs"}
      </button>
      {disabled && !isPending && (
        <p className="mt-1 text-xs text-muted">Faltan partidos de grupos por cargar.</p>
      )}
      {error && <p className="mt-2 text-sm text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
