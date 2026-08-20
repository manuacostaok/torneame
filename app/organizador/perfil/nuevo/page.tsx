"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createOrganizerProfile } from "@/app/actions/auth";
import { useToast } from "@/app/components/Toast";

export default function NewOrganizerProfilePage() {
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [paymentAlias, setPaymentAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { update } = useSession();

  function handleOrgNameChange(value: string) {
    setOrgName(value);
    // auto-genera el slug a partir del nombre, para no pedirle a nadie
    // que piense en "url amigable" — se puede editar igual si no le gusta
    setSlug(
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // saca acentos
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrganizerProfile({
        orgName,
        slug,
        bio: bio || undefined,
        paymentAlias: paymentAlias || undefined,
      });
      // Si el usuario todavía era PLAYER, el server action ya lo promovió a
      // ORGANIZER en la base — esto refresca el JWT de la sesión actual con
      // el rol nuevo, para no tener que pedirle reloguear para poder crear
      // torneos (el requireRole de createTournament chequea la sesión, no
      // la base, así que sin este refresh seguiría bloqueado hasta el
      // próximo login).
      await update({ role: "ORGANIZER" });
      toast("¡Perfil de organizador listo!", "success");
      router.push("/organizador/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo crear el perfil", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium">Un último paso</h1>
      <p className="mt-1 text-sm text-secondary">
        Así te van a ver los jugadores — como Team Coronel, pero con tu nombre.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          value={orgName}
          onChange={(e) => handleOrgNameChange(e.target.value)}
          placeholder="Nombre del organizador (ej. Torneos Team Coronel)"
          required
          minLength={2}
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <div>
          <div className="flex items-center rounded-md border border-strong px-3 py-2 text-sm">
            <span className="text-muted">torneame.app/organizadores/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              required
              minLength={3}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Contanos de qué van tus torneos (opcional)"
          maxLength={300}
          rows={3}
          className="rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <div>
          <input
            value={paymentAlias}
            onChange={(e) => setPaymentAlias(e.target.value)}
            placeholder="Alias o CBU para cobrar inscripciones (opcional)"
            maxLength={60}
            className="w-full rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            Los jugadores te transfieren la inscripción directo a vos acá — Torneame no cobra
            comisión ni toca esa plata. Lo podés cargar después si todavía no lo tenés a mano.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Creando..." : "Listo, empezar"}
        </button>
      </form>
    </main>
  );
}
