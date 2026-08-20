"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findTournamentByCode } from "@/app/actions/tournaments";
import { useToast } from "@/app/components/Toast";

export function JoinByCodeBox() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const tournament = await findTournamentByCode(code);
      router.push(`/torneos/${tournament.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo buscar el código", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2 rounded-xl bg-surface-1 p-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="¿Tenés un código de torneo privado? Escribilo acá"
        maxLength={6}
        className="min-w-0 flex-1 rounded-md border border-strong bg-transparent px-3 py-2 text-sm uppercase"
      />
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="flex-shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
