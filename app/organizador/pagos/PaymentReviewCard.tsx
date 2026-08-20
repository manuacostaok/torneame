"use client";

import { useState, useTransition } from "react";
import { confirmPayment } from "@/app/actions/registrations";
import { useToast } from "@/app/components/Toast";

interface PaymentReviewCardProps {
  registrationId: string;
  playerName: string;
  gamertag: string;
  tournamentName: string;
  amount: number;
  receiptImageUrl: string | null;
}

export function PaymentReviewCard({
  registrationId,
  playerName,
  gamertag,
  tournamentName,
  amount,
  receiptImageUrl,
}: PaymentReviewCardProps) {
  const [resolved, setResolved] = useState<"approved" | "rejected" | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleDecide(approved: boolean) {
    startTransition(async () => {
      try {
        await confirmPayment(registrationId, approved);
        setResolved(approved ? "approved" : "rejected");
        toast(approved ? "Inscripción confirmada" : "Inscripción rechazada", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo procesar", "error");
      }
    });
  }

  if (resolved) {
    return (
      <div className="rounded-xl bg-surface-1 p-4 text-sm text-muted">
        {playerName} — {resolved === "approved" ? "aprobado ✓" : "rechazado ✕"}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-1 p-4">
      <p className="font-medium">{playerName}</p>
      <p className="text-xs text-muted">
        @{gamertag} · {tournamentName}
      </p>
      <p className="mt-1 text-sm">
        Transfirió <span className="font-medium">${amount.toLocaleString("es-AR")}</span>
      </p>

      {receiptImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={receiptImageUrl}
          alt="Comprobante de transferencia"
          className="mt-3 w-full rounded-md border border-strong"
        />
      ) : (
        <p className="mt-3 text-xs text-[var(--text-danger)]">No subió comprobante</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleDecide(true)}
          disabled={isPending}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Pasa
        </button>
        <button
          onClick={() => handleDecide(false)}
          disabled={isPending}
          className="flex-1 rounded-md border border-strong px-4 py-2 text-sm text-[var(--text-danger)] disabled:opacity-60"
        >
          No pasa
        </button>
      </div>
    </div>
  );
}
