"use client";

import { BracketStructure } from "@/lib/brackets/types";

// El scroll horizontal es la solución correcta en mobile para un bracket:
// intentar comprimir todas las rondas en 375px de ancho lo haría ilegible.
// El usuario desliza el dedo entre rondas, como hace cualquier app de esports.
export function BracketView({
  structureJson,
  nameMap,
}: {
  structureJson: unknown;
  nameMap?: Record<string, string>;
}) {
  const structure = structureJson as BracketStructure;
  const display = (id: string | null) => (id ? nameMap?.[id] ?? id : "Pendiente");
  const rounds = Array.from(new Set(structure.matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {rounds.map((round) => (
        <div key={round} className="flex min-w-[160px] flex-col justify-center gap-3">
          <p className="text-xs text-muted">Ronda {round}</p>
          {structure.matches
            .filter((m) => m.round === round)
            .map((match) => (
              <div
                key={match.id}
                className={`rounded-md p-2 text-sm ${
                  match.winnerId
                    ? "bg-[var(--bg-success)] text-[var(--text-success)]"
                    : match.playerAId && match.playerBId
                    ? "border border-accent bg-surface-1"
                    : "bg-surface-1 text-muted"
                }`}
              >
                {display(match.playerAId)} vs {display(match.playerBId)}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
