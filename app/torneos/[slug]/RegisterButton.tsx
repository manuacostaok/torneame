"use client";

import { useState, useTransition } from "react";
import { registerForTournament } from "@/app/actions/registrations";
import { ImageUploader } from "@/app/components/ImageUploader";
import { useToast } from "@/app/components/Toast";

interface RegisterButtonProps {
  tournamentId: string;
  isLoggedIn: boolean;
  spotsLeft: number;
  entryFee: number;
  organizerPaymentAlias: string | null;
}

export function RegisterButton({
  tournamentId,
  isLoggedIn,
  spotsLeft,
  entryFee,
  organizerPaymentAlias,
}: RegisterButtonProps) {
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function submit(receiptImageUrl?: string) {
    startTransition(async () => {
      try {
        const result = await registerForTournament({ tournamentId, receiptImageUrl });
        if (result.needsReview) {
          toast("¡Comprobante recibido! El organizador lo va a revisar y confirmar.", "success");
        } else {
          toast("¡Listo, quedaste inscripto!", "success");
        }
        window.location.reload();
      } catch (err) {
        toast(err instanceof Error ? err.message : "No pudimos inscribirte", "error");
      }
    });
  }

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/torneos/${tournamentId}`;
      return;
    }
    if (entryFee > 0) {
      setShowPaymentPanel(true);
      return;
    }
    submit();
  }

  if (spotsLeft <= 0) {
    return (
      <button disabled className="rounded-md bg-surface-2 px-5 py-2.5 text-sm text-muted">
        Sin cupos
      </button>
    );
  }

  if (showPaymentPanel) {
    if (!organizerPaymentAlias) {
      return (
        <div className="w-full max-w-xs rounded-md bg-surface-2 p-4 text-sm text-secondary">
          El organizador todavía no cargó un alias de pago — escribile antes de transferir nada.
        </div>
      );
    }

    return (
      <div className="w-full max-w-xs rounded-md bg-surface-2 p-4">
        <p className="text-sm text-secondary">
          Transferí <span className="font-medium text-primary">${entryFee.toLocaleString("es-AR")}</span>{" "}
          al alias:
        </p>
        <p className="mt-1 text-lg font-medium tracking-wide">{organizerPaymentAlias}</p>
        <p className="mt-2 text-xs text-muted">
          Después subí el comprobante acá — el organizador lo revisa y confirma tu lugar.
        </p>
        <div className="mt-3">
          <ImageUploader value={receiptUrl} onChange={setReceiptUrl} label="Comprobante" />
        </div>
        <button
          onClick={() => submit(receiptUrl)}
          disabled={isPending || !receiptUrl}
          className="mt-3 w-full rounded-md bg-primary px-4 py-2.5 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Enviando..." : "Confirmar inscripción"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex-shrink-0 whitespace-nowrap rounded-md bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-60"
    >
      {isPending ? "Inscribiendo..." : "Inscribirme"}
    </button>
  );
}
