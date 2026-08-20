"use client";

import { useState } from "react";
import { updatePaymentAlias } from "@/app/actions/auth";
import { useToast } from "@/app/components/Toast";

export function PaymentAliasEditor({ currentAlias }: { currentAlias: string }) {
  const [alias, setAlias] = useState(currentAlias);
  // Lo que se muestra en modo lectura — separado de "alias" (el valor del
  // input) para no depender del prop del server component, que queda
  // desactualizado después de guardar sin un router.refresh().
  const [savedAlias, setSavedAlias] = useState(currentAlias);
  const [editing, setEditing] = useState(!currentAlias);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSave() {
    setLoading(true);
    try {
      await updatePaymentAlias(alias);
      setSavedAlias(alias);
      toast("Alias de pago actualizado", "success");
      setEditing(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo guardar", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-1 p-4 text-sm">
        <div>
          <p className="text-xs text-muted">Alias/CBU para cobrar inscripciones</p>
          <p className="mt-1 font-medium">{savedAlias}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-accent">
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-strong p-4 text-sm">
      <p className="text-xs text-muted">Alias/CBU para cobrar inscripciones</p>
      <div className="mt-2 flex gap-2">
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="ej. team.coronel.mp"
          maxLength={60}
          className="flex-1 rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        Los jugadores lo ven cuando se inscriben a un torneo pago tuyo y te transfieren ahí
        directo.
      </p>
    </div>
  );
}
