"use client";

import { BracketMatch, StoredBracket } from "@/lib/brackets/types";

// El scroll horizontal es la solución correcta en mobile para un bracket:
// intentar comprimir todas las rondas en 375px de ancho lo haría ilegible.
// El usuario desliza el dedo entre rondas, como hace cualquier app de esports.
function MatchColumns({
  matches,
  nameMap,
}: {
  matches: BracketMatch[];
  nameMap: Record<string, string>;
}) {
  const display = (id: string | null) => (id ? (nameMap[id] ?? id) : "Pendiente");
  const sides = Array.from(new Set(matches.map((m) => m.bracketSide ?? "single")));

  return (
    <>
      {sides.map((side) => {
        const sideMatches = matches.filter((m) => (m.bracketSide ?? "single") === side);
        const rounds = Array.from(new Set(sideMatches.map((m) => m.round))).sort((a, b) => a - b);
        return (
          <div key={side} className="flex gap-4 overflow-x-auto pb-2">
            {rounds.map((round) => (
              <div key={round} className="flex min-w-[160px] flex-col justify-center gap-3">
                <p className="text-xs text-muted">Ronda {round}</p>
                {sideMatches
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
      })}
    </>
  );
}

export function BracketView({
  structureJson,
  nameMap,
}: {
  structureJson: unknown;
  nameMap: Record<string, string>;
}) {
  const stored = structureJson as StoredBracket;

  if (stored.kind === "groups") {
    return (
      <div className="flex flex-col gap-6">
        {stored.groups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-sm font-medium">{group.name}</p>
            <MatchColumns matches={group.structure.matches} nameMap={group.playerNames} />
          </div>
        ))}
        {stored.playoffs && (
          <div>
            <p className="mb-2 text-sm font-medium">Playoffs</p>
            <MatchColumns matches={stored.playoffs.matches} nameMap={nameMap} />
          </div>
        )}
      </div>
    );
  }

  return <MatchColumns matches={stored.matches} nameMap={nameMap} />;
}
