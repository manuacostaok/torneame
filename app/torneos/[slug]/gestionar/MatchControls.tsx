"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { callMatch, disqualifyPlayer, reportMatchResult, setMatchStation } from "@/app/actions/matches";
import { useToast } from "@/app/components/Toast";
import { DQCountdown } from "@/app/components/DQCountdown";

interface PendingReport {
  scoreA: number;
  scoreB: number;
  reportedAt: string;
}

export interface MatchControlsProps {
  matchId: string;
  playerAId: string | null;
  playerBId: string | null;
  playerAName: string;
  playerBName: string;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  calledAt: string | null;
  station: string | null;
  pendingReports: { A?: PendingReport; B?: PendingReport } | null;
}

export function MatchControls(props: MatchControlsProps) {
  const { matchId, playerAId, playerBId, playerAName, playerBName, winnerId, calledAt } = props;
  const [station, setStation] = useState(props.station ?? "");
  const [inputScoreA, setInputScoreA] = useState(props.scoreA?.toString() ?? "");
  const [inputScoreB, setInputScoreB] = useState(props.scoreB?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function run(action: () => Promise<unknown>, successMessage?: string) {
    startTransition(async () => {
      try {
        await action();
        if (successMessage) toast(successMessage, "success");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Algo salió mal", "error");
      }
    });
  }

  if (!playerAId || !playerBId) {
    return <p className="text-sm text-muted">Esperando a que se defina el rival</p>;
  }

  if (winnerId) {
    return (
      <p className="text-sm">
        <span className={winnerId === playerAId ? "font-medium" : "text-secondary"}>
          {playerAName} {props.scoreA ?? ""}
        </span>
        {" — "}
        <span className={winnerId === playerBId ? "font-medium" : "text-secondary"}>
          {props.scoreB ?? ""} {playerBName}
        </span>
      </p>
    );
  }

  const disagreement =
    props.pendingReports?.A &&
    props.pendingReports?.B &&
    (props.pendingReports.A.scoreA !== props.pendingReports.B.scoreA ||
      props.pendingReports.A.scoreB !== props.pendingReports.B.scoreB);

  return (
    <div className="flex flex-col gap-2 text-sm">
      {disagreement && (
        <p className="rounded-md bg-[var(--bg-warning)] p-2 text-xs text-[var(--text-warning)]">
          Los jugadores reportaron resultados distintos — {playerAName} dice{" "}
          {props.pendingReports!.A!.scoreA}-{props.pendingReports!.A!.scoreB}, {playerBName} dice{" "}
          {props.pendingReports!.B!.scoreA}-{props.pendingReports!.B!.scoreB}. Cargá vos el resultado real.
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          value={station}
          onChange={(e) => setStation(e.target.value)}
          onBlur={() => run(() => setMatchStation(matchId, station))}
          placeholder="Mesa / estación (opcional)"
          maxLength={40}
          className="w-40 rounded-md border border-strong px-2 py-1 text-xs"
        />
        {!calledAt ? (
          <button
            onClick={() => run(() => callMatch(matchId), "Jugadores convocados")}
            disabled={isPending}
            className="rounded-md border border-strong px-2 py-1 text-xs disabled:opacity-60"
          >
            Llamar a jugar
          </button>
        ) : (
          <DQCountdown calledAt={calledAt} />
        )}
      </div>

      {calledAt && (
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => run(() => disqualifyPlayer(matchId, playerAId), `${playerAName} descalificado`)}
            disabled={isPending}
            className="rounded-md border border-[var(--text-danger)] px-2 py-1 text-[var(--text-danger)] disabled:opacity-60"
          >
            Descalificar a {playerAName}
          </button>
          <button
            onClick={() => run(() => disqualifyPlayer(matchId, playerBId), `${playerBName} descalificado`)}
            disabled={isPending}
            className="rounded-md border border-[var(--text-danger)] px-2 py-1 text-[var(--text-danger)] disabled:opacity-60"
          >
            Descalificar a {playerBName}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="w-24 truncate text-xs text-secondary">{playerAName}</span>
        <input
          type="number"
          min={0}
          value={inputScoreA}
          onChange={(e) => setInputScoreA(e.target.value)}
          className="w-14 rounded-md border border-strong px-2 py-1 text-xs"
        />
        <span className="text-xs text-secondary">—</span>
        <input
          type="number"
          min={0}
          value={inputScoreB}
          onChange={(e) => setInputScoreB(e.target.value)}
          className="w-14 rounded-md border border-strong px-2 py-1 text-xs"
        />
        <span className="w-24 truncate text-xs text-secondary">{playerBName}</span>
        <button
          onClick={() => {
            const a = Number(inputScoreA);
            const b = Number(inputScoreB);
            if (Number.isNaN(a) || Number.isNaN(b)) {
              toast("Cargá los dos puntajes", "error");
              return;
            }
            if (a === b) {
              toast("No puede ser empate — tiene que haber un ganador", "error");
              return;
            }
            const winner = a > b ? playerAId : playerBId;
            run(() => reportMatchResult(matchId, winner, a, b), "Resultado cargado");
          }}
          disabled={isPending}
          className="rounded-md bg-primary px-2 py-1 text-xs text-white disabled:opacity-60"
        >
          Confirmar resultado
        </button>
      </div>
    </div>
  );
}
