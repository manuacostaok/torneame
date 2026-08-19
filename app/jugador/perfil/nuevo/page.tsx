"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlayerProfile } from "@/app/actions/auth";
import { useToast } from "@/app/components/Toast";

export default function NewPlayerProfilePage() {
  const [gamertag, setGamertag] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createPlayerProfile({ gamertag });
      toast("¡Listo!", "success");
      router.push("/jugador/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo crear el perfil", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium">Elegí tu gamertag</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          value={gamertag}
          onChange={(e) => setGamertag(e.target.value)}
          placeholder="Ej. facu_gg"
          required
          minLength={2}
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Creando..." : "Listo"}
        </button>
      </form>
    </main>
  );
}
