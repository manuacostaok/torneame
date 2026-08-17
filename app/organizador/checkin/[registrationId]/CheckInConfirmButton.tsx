"use client";

import { useState, useTransition } from "react";
import { checkInRegistration } from "@/app/actions/checkin";
import { useToast } from "@/app/components/Toast";

export function CheckInConfirmButton({ registrationId }: { registrationId: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    startTransition(async () => {
      try {
        await checkInRegistration(registrationId);
        setDone(true);
        toast("Check-in confirmado", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo confirmar", "error");
      }
    });
  }

  if (done) return <p className="mt-4 text-sm text-emerald-500">¡Listo, check-in confirmado!</p>;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="mt-4 w-full rounded-md bg-primary px-4 py-3 text-sm text-white disabled:opacity-60"
    >
      {isPending ? "Confirmando..." : "Confirmar check-in"}
    </button>
  );
}
