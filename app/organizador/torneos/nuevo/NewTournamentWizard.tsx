"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/app/actions/tournaments";
import { useToast } from "@/app/components/Toast";
import { ImageUploader } from "@/app/components/ImageUploader";

interface Game {
  id: string;
  name: string;
}

const STEPS = ["Datos básicos", "Formato y reglas", "Premios", "Inscripción", "Publicar"] as const;

// Mismo shape que el schema de zod del server action — repetido acá a
// propósito: la validación real y la que no se puede saltear vive en el
// servidor (app/actions/tournaments.ts); esto es solo para no dejar
// avanzar de paso con campos vacíos y dar feedback inmediato al organizador.
interface FormState {
  gameId: string;
  name: string;
  description: string;
  bannerImageUrl: string;
  format: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "GROUPS";
  mode: string;
  entryFee: string;
  prizePoolBase: string;
  locationType: "ONLINE" | "PRESENCIAL";
  venueAddress: string;
  startsAt: string;
  registrationDeadline: string;
  maxPlayers: string;
}

const initialState: FormState = {
  gameId: "",
  name: "",
  description: "",
  bannerImageUrl: "",
  format: "SINGLE_ELIMINATION",
  mode: "1v1",
  entryFee: "0",
  prizePoolBase: "0",
  locationType: "PRESENCIAL",
  venueAddress: "",
  startsAt: "",
  registrationDeadline: "",
  maxPlayers: "16",
};

export function NewTournamentWizard({ games }: { games: Game[] }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0 && (!form.gameId || form.name.trim().length < 3)) {
      return "Elegí un juego y un nombre de al menos 3 caracteres";
    }
    if (step === 2 && Number(form.prizePoolBase) < 0) {
      return "El premio no puede ser negativo";
    }
    if (step === 3) {
      if (!form.startsAt || !form.registrationDeadline) return "Completá las fechas";
      if (new Date(form.registrationDeadline) >= new Date(form.startsAt)) {
        return "El cierre de inscripción tiene que ser antes de que arranque el torneo";
      }
      if (Number(form.maxPlayers) < 2) return "Necesitás al menos 2 cupos";
    }
    return null;
  }

  function handleNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const tournament = await createTournament({
          gameId: form.gameId,
          name: form.name,
          description: form.description || undefined,
          bannerImageUrl: form.bannerImageUrl || undefined,
          format: form.format,
          mode: form.mode,
          entryFee: Number(form.entryFee),
          prizePoolBase: Number(form.prizePoolBase),
          locationType: form.locationType,
          venueAddress: form.venueAddress || undefined,
          startsAt: new Date(form.startsAt),
          registrationDeadline: new Date(form.registrationDeadline),
          maxPlayers: Number(form.maxPlayers),
        });
        router.push(`/torneos/${tournament.id}`);
        toast("Torneo creado como borrador — publicalo cuando quieras", "success");
      } catch (err) {
        // El server action ya valida con zod y chequea el rol — acá solo
        // mostramos el mensaje, no repetimos la lógica de validación
        const message = err instanceof Error ? err.message : "No se pudo crear el torneo";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex gap-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-2"}`}
          />
        ))}
      </div>
      <p className="mb-4 text-sm text-secondary">{STEPS[step]}</p>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <select
            value={form.gameId}
            onChange={(e) => update("gameId", e.target.value)}
            className="rounded-md border border-strong px-3 py-2 text-sm"
          >
            <option value="">Elegí un juego</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nombre del torneo"
            maxLength={120}
            className="rounded-md border border-strong px-3 py-2 text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Descripción (opcional)"
            maxLength={1000}
            className="rounded-md border border-strong px-3 py-2 text-sm"
            rows={3}
          />
          <ImageUploader
            value={form.bannerImageUrl}
            onChange={(url) => update("bannerImageUrl", url)}
            label="Imagen/flyer del torneo (opcional)"
          />
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <select
            value={form.format}
            onChange={(e) => update("format", e.target.value as FormState["format"])}
            className="rounded-md border border-strong px-3 py-2 text-sm"
          >
            <option value="SINGLE_ELIMINATION">Eliminación simple</option>
            <option value="DOUBLE_ELIMINATION">Eliminación doble</option>
            <option value="ROUND_ROBIN">Round robin</option>
            <option value="LEAGUE">Liga</option>
            <option value="GROUPS">Fase de grupos</option>
          </select>
          <input
            value={form.mode}
            onChange={(e) => update("mode", e.target.value)}
            placeholder="Modo (ej. 1v1, 2v2, 3vs3 vale todo)"
            className="rounded-md border border-strong px-3 py-2 text-sm"
          />
          <select
            value={form.locationType}
            onChange={(e) => update("locationType", e.target.value as FormState["locationType"])}
            className="rounded-md border border-strong px-3 py-2 text-sm"
          >
            <option value="PRESENCIAL">Presencial</option>
            <option value="ONLINE">Online</option>
          </select>
          {form.locationType === "PRESENCIAL" && (
            <input
              value={form.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
              placeholder="Dirección del lugar"
              className="rounded-md border border-strong px-3 py-2 text-sm"
            />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <label className="text-sm text-secondary">
            Premio base ($)
            <input
              type="number"
              min={0}
              value={form.prizePoolBase}
              onChange={(e) => update("prizePoolBase", e.target.value)}
              className="mt-1 w-full rounded-md border border-strong px-3 py-2 text-sm"
            />
          </label>
          <p className="text-xs text-muted">
            El premio dinámico según cantidad de inscriptos se configura en el
            siguiente paso del roadmap — por ahora se usa el premio base fijo.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <label className="text-sm text-secondary">
            Costo de inscripción ($, 0 = gratis)
            <input
              type="number"
              min={0}
              value={form.entryFee}
              onChange={(e) => update("entryFee", e.target.value)}
              className="mt-1 w-full rounded-md border border-strong px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-secondary">
            Cupo máximo de jugadores
            <input
              type="number"
              min={2}
              max={512}
              value={form.maxPlayers}
              onChange={(e) => update("maxPlayers", e.target.value)}
              className="mt-1 w-full rounded-md border border-strong px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-secondary">
            Cierre de inscripción
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => update("registrationDeadline", e.target.value)}
              className="mt-1 w-full rounded-md border border-strong px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-secondary">
            Fecha y hora de inicio
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => update("startsAt", e.target.value)}
              className="mt-1 w-full rounded-md border border-strong px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-md bg-surface-1 p-4 text-sm">
          <p className="font-medium">{form.name || "(sin nombre)"}</p>
          <p className="mt-1 text-secondary">
            {form.mode} &middot; {form.format} &middot; {form.locationType}
          </p>
          <p className="mt-1 text-secondary">
            Cupo: {form.maxPlayers} &middot; Inscripción: ${form.entryFee || 0} &middot; Premio: $
            {form.prizePoolBase || 0}
          </p>
          <p className="mt-3 text-xs text-muted">
            Se crea como borrador. Lo publicás (y ahí se abren las
            inscripciones) desde el dashboard cuando quieras.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--text-danger)]">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className="rounded-md border border-strong px-4 py-2 text-sm disabled:opacity-40"
        >
          Atrás
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? "Creando..." : "Crear torneo"}
          </button>
        )}
      </div>
    </div>
  );
}
