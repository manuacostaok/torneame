"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPlayerReport } from "@/app/actions/matches";
import { useToast } from "@/app/components/Toast";
import { DQCountdown } from "@/app/components/DQCountdown";

export function PlayerMatchCard({
  matchId,
  opponentName,
  station,
  calledAt,
  isPlayerA,
  alreadyReported,
}: {
  matchId: string;
  opponentName: string;
  station: string | null;
  calledAt: string | null;
  isPlayerA: boolean;
  alreadyReported: boolean;
}) {
  const [myScore, setMyScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(alreadyReported);
  const router = useRouter();
  const toast = useToast();

  function handleSubmit() {
    const my = Number(myScore);
    const opp = Number(opponentScore);
    if (Number.isNaN(my) || Number.isNaN(opp)) {
      toast("Cargá los dos puntajes", "error");
      return;
    }
    if (my === opp) {
      toast("No puede ser empate", "error");
      return;
    }
    const scoreA = isPlayerA ? my : opp;
    const scoreB = isPlayerA ? opp : my;
    startTransition(async () => {
      try {
        const result = await submitPlayerReport(matchId, scoreA, scoreB);
        setSubmitted(true);
        if (result && "disputed" in result && result.disputed) {
          toast("Tu reporte no coincide con el del rival — el organizador lo va a resolver", "info");
        } else {
          toast("¡Resultado confirmado!", "success");
        }
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo cargar el resultado", "error");
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl bg-surface-1 p-4 text-left text-sm">
      <p className="text-secondary">Tu próximo partido</p>
      <p className="mt-1 font-medium">vs {opponentName}</p>
      {station && <p className="mt-1 text-xs text-secondary">Mesa: {station}</p>}
      {calledAt && (
        <p className="mt-1 text-xs">
          <DQCountdown calledAt={calledAt} />
        </p>
      )}

      {submitted ? (
        <p className="mt-3 text-xs text-secondary">
          Ya cargaste tu resultado. Si no coincide con lo que reportó el rival, el organizador lo
          va a destrabar.
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={myScore}
            onChange={(e) => setMyScore(e.target.value)}
            placeholder="Vos"
            className="w-16 rounded-md border border-strong px-2 py-1 text-sm"
          />
          <span className="text-xs text-secondary">—</span>
          <input
            type="number"
            min={0}
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            placeholder="Rival"
            className="w-16 rounded-md border border-strong px-2 py-1 text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1 text-xs text-white disabled:opacity-60"
          >
            Reportar resultado
          </button>
        </div>
      )}
    </div>
  );
}
