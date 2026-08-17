"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFriendTournament } from "@/app/actions/friendTournaments";
import { useToast } from "@/app/components/Toast";

const FREE_MAX_PLAYERS = 22;
const MODE_PRESETS = ["1v1", "2v2", "3v3", "5v5", "6v6", "7v7"] as const;

export function FriendTournamentForm({ games }: { games: { id: string; name: string }[] }) {
  const [gameId, setGameId] = useState("");
  const [mode, setMode] = useState<string>("2v2");
  const [customMode, setCustomMode] = useState(false);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  function addPlayerField() {
    if (names.length >= FREE_MAX_PLAYERS) {
      toast(`El plan gratuito soporta hasta ${FREE_MAX_PLAYERS} jugadores`, "info");
      return;
    }
    setNames((prev) => [...prev, ""]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);

    startTransition(async () => {
      try {
        const result = await createFriendTournament({ gameId, mode, playerNames: cleanNames });
        toast("¡Equipos sorteados!", "success");
        router.push(`/amigos/${result.id}`);
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo armar el sorteo", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <select
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        required
        className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
      >
        <option value="">Elegí un juego</option>
        {games.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted">Modo</p>
        <div className="flex flex-wrap gap-2">
          {MODE_PRESETS.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => {
                setMode(m);
                setCustomMode(false);
              }}
              className={`rounded-md border px-3 py-2 text-sm ${
                !customMode && mode === m ? "border-primary bg-primary/10 text-accent" : "border-strong"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className={`rounded-md border px-3 py-2 text-sm ${
              customMode ? "border-primary bg-primary/10 text-accent" : "border-strong"
            }`}
          >
            Otro
          </button>
        </div>
        {customMode && (
          <input
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            placeholder="Ej: 11v11"
            className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted">
          Jugadores ({names.filter((n) => n.trim()).length}/{FREE_MAX_PLAYERS} gratis)
        </p>
        {names.map((name, i) => (
          <input
            key={i}
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Jugador ${i + 1}`}
            maxLength={30}
            className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
          />
        ))}
        <button
          type="button"
          onClick={addPlayerField}
          className="rounded-md border border-dashed border-strong px-3 py-2 text-sm text-secondary"
        >
          + Agregar jugador
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending || !gameId}
        className="rounded-md bg-primary px-4 py-3 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "Sorteando..." : "Sortear equipos"}
      </button>
    </form>
  );
}
