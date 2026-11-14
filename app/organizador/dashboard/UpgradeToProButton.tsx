"use client";

import { useState, useTransition } from "react";
import { startProSubscription } from "@/app/actions/plan";
import { useToast } from "@/app/components/Toast";
import { unwrapAction } from "@/lib/actionResult";

export function UpgradeToProButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const { checkoutUrl } = await unwrapAction(startProSubscription());
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
      <p className="font-medium">Pasate a PRO — $25.000/mes</p>
      <p className="mt-1 text-xs text-secondary">
        Sacate la marca &quot;Organizado con Torneame&quot;, transmití tus brackets a una TV, y
        (próximamente) usá tu propio dominio. Se cobra por Mercado Pago, cancelás cuando quieras.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Redirigiendo..." : "Pasarme a PRO"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
