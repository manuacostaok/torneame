"use client";

import { useState, useTransition } from "react";
import { generateTournamentPitch } from "@/app/actions/ai";
import { useToast } from "@/app/components/Toast";

export function TournamentPitchGenerator({ tournamentId }: { tournamentId: string }) {
  const [pitch, setPitch] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const text = await generateTournamentPitch(tournamentId);
        setPitch(text);
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo generar el texto", "error");
      }
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(pitch);
    toast("Copiado", "success");
  }

  return (
    <div className="mb-4 rounded-xl bg-surface-1 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-secondary">🤖 Texto para compartir el torneo, generado con IA</p>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex-shrink-0 rounded-md border border-strong px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {isPending ? "Generando..." : pitch ? "Generar de nuevo" : "Generar"}
        </button>
      </div>
      {pitch && (
        <div className="mt-3">
          <textarea
            readOnly
            value={pitch}
            rows={4}
            className="w-full rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={handleCopy}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-xs text-white"
          >
            Copiar
          </button>
        </div>
      )}
    </div>
  );
}
