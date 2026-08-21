"use client";

import { useState, useTransition } from "react";
import { confirmPayment } from "@/app/actions/registrations";
import { analyzePaymentReceipt } from "@/app/actions/ai";
import { useToast } from "@/app/components/Toast";

interface PaymentReviewCardProps {
  registrationId: string;
  playerName: string;
  gamertag: string;
  tournamentName: string;
  amount: number;
  receiptImageUrl: string | null;
}

interface AiCheck {
  esComprobante: boolean;
  montoEncontrado: number | null;
  coincide: boolean;
  nota: string;
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
  const [aiCheck, setAiCheck] = useState<AiCheck | null>(null);
  const [isChecking, startCheck] = useTransition();
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

  function handleAiCheck() {
    startCheck(async () => {
      try {
        const result = await analyzePaymentReceipt(registrationId);
        setAiCheck(result);
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo revisar con IA", "error");
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

      {receiptImageUrl && !aiCheck && (
        <button
          onClick={handleAiCheck}
          disabled={isChecking}
          className="mt-3 w-full rounded-md border border-dashed border-strong px-3 py-2 text-xs text-secondary disabled:opacity-60"
        >
          {isChecking ? "Revisando con IA..." : "🤖 Revisar comprobante con IA"}
        </button>
      )}

      {aiCheck && (
        <div
          className={`mt-3 rounded-md p-3 text-xs ${
            aiCheck.coincide
              ? "bg-[var(--bg-success)] text-[var(--text-success)]"
              : "bg-[var(--bg-warning)] text-[var(--text-warning)]"
          }`}
        >
          <p className="font-medium">
            {aiCheck.coincide
              ? "✓ El monto parece coincidir"
              : "⚠ Revisalo con cuidado — no pudimos confirmar el monto solos"}
          </p>
          {aiCheck.montoEncontrado !== null && (
            <p className="mt-1">La IA leyó: ${aiCheck.montoEncontrado.toLocaleString("es-AR")}</p>
          )}
          {aiCheck.nota && <p className="mt-1 opacity-80">{aiCheck.nota}</p>}
          <p className="mt-1 opacity-60">
            Es una ayuda, no un veredicto — la decisión final es tuya.
          </p>
        </div>
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
