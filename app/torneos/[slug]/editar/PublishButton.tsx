"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishTournament } from "@/app/actions/tournaments";
import { useToast } from "@/app/components/Toast";

export function PublishButton({ tournamentId }: { tournamentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      try {
        await publishTournament(tournamentId);
        toast("¡Torneo publicado! Ya se pueden inscribir.", "success");
        router.push(`/torneos/${tournamentId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo publicar";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div className="mt-4">
      <button
        onClick={handlePublish}
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Publicando..." : "Publicar torneo"}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
