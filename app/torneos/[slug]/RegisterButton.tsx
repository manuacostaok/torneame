"use client";

import { useTransition } from "react";
import { registerForTournament } from "@/app/actions/registrations";
import { useToast } from "@/app/components/Toast";

export function RegisterButton({
  tournamentId,
  isLoggedIn,
  spotsLeft,
}: {
  tournamentId: string;
  isLoggedIn: boolean;
  spotsLeft: number;
}) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/torneos/${tournamentId}`;
      return;
    }
    startTransition(async () => {
      try {
        const result = await registerForTournament(tournamentId);
        if (result.paymentUrl) {
          toast("Te llevamos a Mercado Pago para completar el pago", "info");
          window.location.href = result.paymentUrl;
        } else {
          toast("¡Listo, quedaste inscripto!", "success");
          window.location.reload();
        }
      } catch (err) {
        toast(err instanceof Error ? err.message : "No pudimos inscribirte", "error");
      }
    });
  }

  if (spotsLeft <= 0) {
    return (
      <button disabled className="rounded-md bg-surface-2 px-5 py-2.5 text-sm text-muted">
        Sin cupos
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex-shrink-0 whitespace-nowrap rounded-md bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-60"
    >
      {isPending ? "Redirigiendo..." : "Inscribirme"}
    </button>
  );
}
