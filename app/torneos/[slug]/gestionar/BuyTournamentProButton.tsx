"use client";

import { useState, useTransition } from "react";
import { buyTournamentPro } from "@/app/actions/plan";
import { useToast } from "@/app/components/Toast";
import { unwrapAction } from "@/lib/actionResult";

export function BuyTournamentProButton({ tournamentId }: { tournamentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const { checkoutUrl } = await unwrapAction(buyTournamentPro(tournamentId));
        if (checkoutUrl) window.location.href = checkoutUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo iniciar el pago";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-strong p-4 text-sm">
      <p className="font-medium">Activar PRO para este torneo — $10.000</p>
      <p className="mt-1 text-xs text-secondary">
        Vista para TV/Chromecast y sin la marca &quot;Organizado con Torneame&quot;, solo para este
        torneo — sin atarte a la suscripción mensual.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Redirigiendo..." : "Activar PRO para este torneo"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
